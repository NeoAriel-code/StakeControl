"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatPauseMessage, isPauseActive } from "@/lib/responsible-gaming";
import { getStorageService, sanitizeUploadedFileName } from "@/lib/storage";
import { createOcrService, getConfiguredOcrProviderName } from "@/lib/ocr-service";
import { createAiExtractionService } from "@/lib/ai-extraction-service";
import { reviewedTicketBetSchema, ticketLegSchema } from "@/lib/ticket-extraction";
import { Prisma } from "@prisma/client";
import { evaluateResponsibleGamingAlerts } from "@/lib/responsible-gaming";
import { getFeatureAccess } from "@/lib/plans";
import { checkRateLimit, formatRateLimitMessage } from "@/lib/rate-limit";
import { buildUserScopedWhere } from "@/lib/security-scopes";

const MAX_TICKET_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".pdf"]);

export type TicketUploadActionState = {
  error?: string;
};

export type TicketReviewActionState = {
  error?: string;
};

function sanitizeJsonRecord(value: Record<string, unknown>): Prisma.InputJsonObject {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as Prisma.InputJsonObject;
}

function getFileExtension(fileName: string) {
  const index = fileName.lastIndexOf(".");
  return index >= 0 ? fileName.slice(index).toLowerCase() : "";
}

function validateTicketFile(file: File) {
  if (!file || file.size === 0) {
    throw new Error("Selecciona un archivo JPG, PNG, WEBP o PDF antes de continuar.");
  }

  if (file.size > MAX_TICKET_UPLOAD_BYTES) {
    throw new Error("El archivo supera el tamaño máximo permitido de 10 MB.");
  }

  const extension = getFileExtension(file.name);
  if (!ALLOWED_MIME_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error("Formato no permitido. Solo se aceptan archivos JPG, PNG, WEBP o PDF.");
  }
}

function validateFileSignature(buffer: Buffer, mimeType: string) {
  const signatures: Record<string, (buffer: Buffer) => boolean> = {
    "image/jpeg": (value) => value[0] === 0xff && value[1] === 0xd8 && value[2] === 0xff,
    "image/png": (value) => value.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    "image/webp": (value) =>
      value.subarray(0, 4).toString("ascii") === "RIFF" && value.subarray(8, 12).toString("ascii") === "WEBP",
    "application/pdf": (value) => value.subarray(0, 5).toString("ascii") === "%PDF-",
  };

  if (!signatures[mimeType]?.(buffer)) {
    throw new Error("El contenido del archivo no coincide con el formato declarado.");
  }
}

export async function uploadTicketAction(
  _prevState: TicketUploadActionState,
  formData: FormData
): Promise<TicketUploadActionState> {
  const user = await requireUser();
  const rateLimit = checkRateLimit({
    key: `upload:${user.id}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return { error: formatRateLimitMessage(rateLimit.resetAt) };
  }

  const limits = await prisma.userLimits.findUnique({
    where: { userId: user.id },
  });

  if (isPauseActive(limits?.pauseUntil)) {
    return {
      error: formatPauseMessage(limits!.pauseUntil!),
    };
  }

  const ocrAccess = await getFeatureAccess(user.id, "ocr_tickets");
  if (!ocrAccess.allowed) {
    return {
      error:
        ocrAccess.upgradeMessage ??
        "Tu plan actual no permite subir más tickets OCR este mes.",
    };
  }

  const fileEntry = formData.get("ticketFile");

  if (!(fileEntry instanceof File)) {
    return {
      error: "No se recibió ningún archivo válido.",
    };
  }

  let ticketImageId = "";

  try {
    validateTicketFile(fileEntry);

    const buffer = Buffer.from(await fileEntry.arrayBuffer());
    validateFileSignature(buffer, fileEntry.type);

    const safeFileName = sanitizeUploadedFileName(fileEntry.name);
    const storage = getStorageService();
    const ocrProviderName = getConfiguredOcrProviderName();
    const ocrService = createOcrService();
    const aiExtractionService = createAiExtractionService();
    const storedObject = await storage.savePrivateObject({
      userId: user.id,
      namespace: "tickets",
      fileName: safeFileName,
      mimeType: fileEntry.type,
      buffer,
    });

    const ticketImage = await prisma.betTicketImage.create({
      data: {
        userId: user.id,
        imageUrl: storedObject.reference,
        fileName: safeFileName,
        mimeType: fileEntry.type,
        fileSizeBytes: storedObject.byteLength,
      },
    });

    const rawText = await ocrService.extractText(storedObject.reference);
    const aiResult = await aiExtractionService.structureBetTicket(rawText, {
      preferredCurrency: user.currency,
      timezone: user.timezone,
    });
    const structuredBet = aiResult.ticket;
    const requiresReview = structuredBet.confidenceScore < 0.85;

    await prisma.aIExtraction.create({
      data: {
        betTicketImageId: ticketImage.id,
        provider: `${ocrProviderName}+${process.env.AI_PROVIDER?.trim().toLowerCase() || "mock"}`,
        model: aiResult.model,
        status: requiresReview ? "requires_review" : "ready_for_review",
        confidence: new Prisma.Decimal(structuredBet.confidenceScore.toString()),
        rawText,
        extractedData: sanitizeJsonRecord({
          ...structuredBet,
          requiresReview,
          aiMetadata: {
            model: aiResult.model,
            estimatedTokens: aiResult.estimatedTokens,
            fallbackUsed: aiResult.fallbackUsed,
          },
        }),
      },
    });

    ticketImageId = ticketImage.id;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo subir el ticket.",
    };
  }

  revalidatePath("/tickets");
  revalidatePath("/tickets/upload");
  redirect(`/tickets/${ticketImageId}/review`);
}

function toDecimal(value: number) {
  return new Prisma.Decimal(value.toString());
}

function getOptionalValue(values: FormDataEntryValue[], index: number) {
  const value = values[index];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function parseTicketLegs(formData: FormData) {
  const events = formData.getAll("legEvent");
  const sports = formData.getAll("legSport");
  const leagues = formData.getAll("legLeague");
  const markets = formData.getAll("legMarket");
  const selections = formData.getAll("legSelection");
  const odds = formData.getAll("legOdds");
  const results = formData.getAll("legResult");

  if (events.length === 0) {
    throw new Error("Agrega al menos una selección al ticket.");
  }

  return events.map((event, index) =>
    ticketLegSchema.parse({
      event,
      sport: getOptionalValue(sports, index),
      league: getOptionalValue(leagues, index),
      market: getOptionalValue(markets, index),
      selection: getOptionalValue(selections, index),
      odds: getOptionalValue(odds, index),
      result: getOptionalValue(results, index) ?? "PENDING",
    })
  );
}

export async function finalizeTicketReviewAction(
  ticketId: string,
  _prevState: TicketReviewActionState,
  formData: FormData
): Promise<TicketReviewActionState> {
  const user = await requireUser();

  const ticketImage = await prisma.betTicketImage.findFirst({
    where: buildUserScopedWhere(user.id, ticketId),
    include: {
      aiExtraction: true,
    },
  });

  if (!ticketImage || !ticketImage.aiExtraction) {
    return {
      error: "No se encontró la extracción asociada al ticket.",
    };
  }

  const limits = await prisma.userLimits.findUnique({
    where: { userId: user.id },
  });

  if (isPauseActive(limits?.pauseUntil)) {
    return {
      error: formatPauseMessage(limits!.pauseUntil!),
    };
  }

  try {
    const legs = parseTicketLegs(formData);
    const primaryLeg = legs[0];

    if (!primaryLeg) {
      throw new Error("Agrega al menos una selección al ticket.");
    }

    const parsed = reviewedTicketBetSchema.parse({
      sportsbook: formData.get("sportsbook"),
      event: legs.length === 1 ? primaryLeg.event : `Ticket con ${legs.length} selecciones`,
      placedAt: formData.get("placedAt"),
      sport: primaryLeg.sport,
      league: primaryLeg.league,
      market: primaryLeg.market,
      selection: primaryLeg.selection,
      betType: formData.get("betType"),
      stake: formData.get("stake"),
      odds: formData.get("odds"),
      currency: formData.get("currency"),
      potentialPayout:
        formData.get("potentialPayout") === "" ? undefined : formData.get("potentialPayout"),
      result: formData.get("result"),
      netProfit: formData.get("netProfit"),
      ticketCode: formData.get("ticketCode"),
      notes: formData.get("notes"),
      confidenceScore: formData.get("confidenceScore"),
      doubtfulFields: formData
        .getAll("doubtfulFields")
        .filter((field): field is string => typeof field === "string"),
    });

    await prisma.$transaction(async (transaction) => {
      const createdBet = await transaction.bet.create({
        data: {
          userId: user.id,
          title: parsed.event,
          sportsbook: parsed.sportsbook,
          ticketCode: parsed.ticketCode,
          sport: parsed.sport,
          league: parsed.league,
          market: parsed.market,
          selection: parsed.selection,
          betType: parsed.betType,
          currency: parsed.currency,
          result: parsed.result,
          stake: toDecimal(parsed.stake),
          odds: toDecimal(parsed.odds),
          potentialPayout:
            parsed.potentialPayout !== undefined ? toDecimal(parsed.potentialPayout) : null,
          profitLoss: toDecimal(parsed.netProfit),
          settledPayout:
            parsed.potentialPayout !== undefined && parsed.result === "WON"
              ? toDecimal(parsed.potentialPayout)
              : parsed.result === "VOID"
                ? toDecimal(parsed.stake)
                : null,
          placedAt: new Date(parsed.placedAt),
          notes: parsed.notes,
          legs: {
            create: legs.map((leg, position) => ({
              position,
              event: leg.event,
              sport: leg.sport,
              league: leg.league,
              market: leg.market,
              selection: leg.selection,
              odds: leg.odds === undefined ? null : toDecimal(leg.odds),
              result: leg.result,
            })),
          },
        },
      });

      await transaction.betTicketImage.update({
        where: { id: ticketImage.id },
        data: { betId: createdBet.id },
      });

      await transaction.aIExtraction.update({
        where: { betTicketImageId: ticketImage.id },
        data: {
          status: "reviewed_and_confirmed",
          confidence: toDecimal(parsed.confidenceScore),
          extractedData: sanitizeJsonRecord({
            ...parsed,
            legs,
            requiresReview: parsed.confidenceScore < 0.85,
          }),
        },
      });
    });

    await evaluateResponsibleGamingAlerts(user.id);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo guardar la apuesta final.",
    };
  }

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}/review`);
  revalidatePath("/bets");
  revalidatePath("/dashboard");
  redirect("/bets");
}
