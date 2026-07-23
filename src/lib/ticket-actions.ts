"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatPauseMessage, isPauseActive } from "@/lib/responsible-gaming";
import { getStorageService, sanitizeUploadedFileName } from "@/lib/storage";
import {
  createOcrService,
  getConfiguredOcrProviderName,
  OcrProcessingError,
} from "@/lib/ocr-service";
import {
  cleanupFailedTicketUpload,
  saveTicketAndExtractText,
  validateFileSignature,
  validateTicketFile,
} from "@/lib/ticket-upload-utils";
import { createAiExtractionService } from "@/lib/ai-extraction-service";
import { extractedBetTicketSchema, reviewedTicketBetSchema, ticketLegSchema } from "@/lib/ticket-extraction";
import { Prisma } from "@prisma/client";
import { evaluateResponsibleGamingAlerts } from "@/lib/responsible-gaming";
import { getFeatureAccess } from "@/lib/plans";
import { checkRateLimit, formatRateLimitMessage } from "@/lib/rate-limit";
import { buildUserScopedWhere } from "@/lib/security-scopes";
import { getHistoricalProfitLoss } from "@/lib/bet-outcomes";
import { resolveFieldSourceAfterEdit } from "@/lib/field-provenance";
import { parseDateTimeInUserTimezone } from "@/lib/user-time-periods";
import { reportOperationalError } from "@/lib/observability/sentry";

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

export async function uploadTicketAction(
  _prevState: TicketUploadActionState,
  formData: FormData
): Promise<TicketUploadActionState> {
  const user = await requireUser();
  const rateLimit = await checkRateLimit({
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
  let storedReference: string | undefined;
  let storage: ReturnType<typeof getStorageService> | undefined;

  try {
    validateTicketFile(fileEntry);

    const buffer = Buffer.from(await fileEntry.arrayBuffer());
    validateFileSignature(buffer, fileEntry.type);

    const safeFileName = sanitizeUploadedFileName(fileEntry.name);
    storage = getStorageService();
    const ocrProviderName = getConfiguredOcrProviderName();
    const ocrService = createOcrService();
    const aiExtractionService = createAiExtractionService();
    const { storedObject, rawText } = await saveTicketAndExtractText({
      storage,
      ocrService,
      input: {
        userId: user.id,
        fileName: safeFileName,
        mimeType: fileEntry.type,
        buffer,
      },
    });
    storedReference = storedObject.reference;

    const ticketImage = await prisma.betTicketImage.create({
      data: {
        userId: user.id,
        imageUrl: storedObject.reference,
        fileName: safeFileName,
        mimeType: fileEntry.type,
        fileSizeBytes: storedObject.byteLength,
      },
    });
    ticketImageId = ticketImage.id;

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

  } catch (error) {
    reportOperationalError(error instanceof OcrProcessingError ? "ocr.failed" : "ai.failed", user.id);
    const cleanupErrors = await cleanupFailedTicketUpload({
      ticketImageId,
      storedReference,
      deleteTicketImage: (id) => prisma.betTicketImage.deleteMany({
        where: buildUserScopedWhere(user.id, id),
      }).then(() => undefined),
      deleteStoredObject: (reference) => storage?.deletePrivateObject(reference) ?? Promise.resolve(),
    });

    for (const cleanupError of cleanupErrors) {
      console.error("Failed to clean up an incomplete ticket upload.", cleanupError);
    }

    return {
      error: error instanceof OcrProcessingError ? error.message : "No se pudo subir el ticket.",
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

    const extraction = extractedBetTicketSchema.safeParse(ticketImage.aiExtraction.extractedData);
    const extractedBet = extraction.success ? extraction.data : undefined;
    const parsed = reviewedTicketBetSchema.parse({
      sportsbook: formData.get("sportsbook"),
      event: legs.length === 1 ? primaryLeg.event : `Ticket con ${legs.length} selecciones`,
      placedAt: formData.get("placedAt"),
      eventStartAt: formData.get("eventStartAt"),
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
    const placedAt = parsed.placedAt
      ? parseDateTimeInUserTimezone(parsed.placedAt, user.timezone)
      : null;
    const eventStartAt = parsed.eventStartAt
      ? parseDateTimeInUserTimezone(parsed.eventStartAt, user.timezone)
      : null;

    if ((parsed.placedAt && !placedAt) || (parsed.eventStartAt && !eventStartAt)) {
      return { error: "La fecha y hora es inválida." };
    }
    const realizedNetProfit = getHistoricalProfitLoss(parsed.result, parsed.stake, parsed.netProfit);
    const placedAtSource = resolveFieldSourceAfterEdit(
      parsed.placedAt,
      extractedBet?.placedAt,
      extractedBet?.placedAtSource
    );
    const eventStartAtSource = resolveFieldSourceAfterEdit(
      parsed.eventStartAt,
      extractedBet?.eventStartAt,
      extractedBet?.eventStartAtSource
    );
    const currencySource = resolveFieldSourceAfterEdit(
      parsed.currency,
      extractedBet?.currency,
      extractedBet?.currencySource
    );

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
          profitLoss: toDecimal(realizedNetProfit),
          settledPayout:
            parsed.potentialPayout !== undefined && parsed.result === "WON"
              ? toDecimal(parsed.potentialPayout)
              : parsed.result === "VOID"
                ? toDecimal(parsed.stake)
                : null,
          placedAt,
          eventStartAt,
          placedAtSource,
          eventStartAtSource,
          currencySource,
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
            netProfit: realizedNetProfit,
            placedAtSource,
            eventStartAtSource,
            currencySource,
            legs,
            requiresReview: parsed.confidenceScore < 0.85,
          }),
        },
      });
    });

    await evaluateResponsibleGamingAlerts(user.id);
  } catch (error) {
    reportOperationalError("bet.persistence_failed", user.id);
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
