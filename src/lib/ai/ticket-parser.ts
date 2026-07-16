import type { AiProvider } from "@/lib/ai/ai-provider";
import { BetResult, BetType, FieldSource } from "@prisma/client";
import { MockAiProvider } from "@/lib/ai/mock-ai-provider";
import { createConfiguredAiProvider } from "@/lib/ai/ai-provider-factory";
import { getAiModelConfig } from "@/lib/ai/ai-config";
import { aiTicketExtractionJsonSchema, aiTicketExtractionSchema } from "@/lib/ai/schemas/ticket-extraction.schema";
import { CURRENCY_CODES, isSupportedCurrency } from "@/lib/currencies";
import { extractedBetTicketSchema, type ExtractedBetTicket } from "@/lib/ticket-extraction";
import { structureMockBetTicket } from "@/lib/mock-ticket-parser";

const MIN_CONFIDENCE = 0.85;
const TICKET_SYSTEM_PROMPT = "Extrae exclusivamente datos ya presentes en el texto OCR. No inventes valores: usa null para campos opcionales desconocidos; si no está la fecha de colocación, usa null en placedAt, y si no está el inicio del evento, usa null en eventStartAt; baja confidenceScore y agrega el campo ausente en doubtfulFields. Si un icono o un mercado inequívoco identifica el deporte, úsalo; de lo contrario usa null. Un botón u oferta que diga CASH OUT no prueba que se haya realizado un cashout: usa CASHOUT solo cuando el OCR confirma una operación completada. Si el evento programado aún no comienza, el resultado debe ser PENDING. Incluye cada selección en legs: una simple tiene una; una múltiple tiene dos o más, normalmente de eventos distintos; un Bet Builder tiene dos o más del mismo evento y usa betType BET_BUILDER. La cuota principal es la cuota total del ticket; cada pierna puede no tener cuota. Esto solo prepara una revisión humana; nunca recomienda apuestas ni decisiones.";

export type TicketRoutingResult = { ticket: ExtractedBetTicket; model: string; estimatedTokens: number; fallbackUsed: boolean };
export type TicketExtractionContext = {
  preferredCurrency?: string;
  timezone?: string;
  referenceDate?: Date;
};

function getProvider(): AiProvider {
  return createConfiguredAiProvider();
}

function sanitizeOcrText(rawText: string) {
  return rawText
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL_REDACTED]")
    .replace(/\b\d{1,2}\.\d{3}\.\d{3}-[0-9Kk]\b/g, "[RUT_REDACTED]")
    .replace(/^(nombre|cliente|titular)\s*:.+$/gim, "$1: [NAME_REDACTED]");
}

function hasDateInOcr(rawText: string) {
  return /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b/.test(rawText);
}

function hasExplicitCurrency(rawText: string) {
  const normalizedText = rawText.toUpperCase();
  return CURRENCY_CODES.some((currency) => new RegExp(`\\b${currency}\\b`).test(normalizedText));
}

function preferredCurrencyFromContext(context: TicketExtractionContext) {
  return isSupportedCurrency(context.preferredCurrency ?? "") ? context.preferredCurrency : undefined;
}

function getDateTimeParts(timezone?: string, referenceDate = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(referenceDate);
    const getPart = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
    return {
      year: Number(getPart("year")),
      month: Number(getPart("month")),
      day: Number(getPart("day")),
      hour: Number(getPart("hour")),
      minute: Number(getPart("minute")),
    };
  } catch {
    const fallback = new Date(referenceDate);
    return {
      year: fallback.getUTCFullYear(),
      month: fallback.getUTCMonth() + 1,
      day: fallback.getUTCDate(),
      hour: fallback.getUTCHours(),
      minute: fallback.getUTCMinutes(),
    };
  }
}

function formatCurrentDateTime(timezone?: string, referenceDate = new Date()) {
  const { year, month, day, hour, minute } = getDateTimeParts(timezone, referenceDate);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function isFutureScheduledEvent(rawText: string, context: TicketExtractionContext) {
  const match = rawText.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\s+(\d{1,2}):(\d{2})\b/);
  if (!match) return false;

  const [, day, month, rawYear, hour, minute] = match;
  const year = rawYear!.length === 2 ? 2000 + Number(rawYear) : Number(rawYear);
  const event = [year, Number(month), Number(day), Number(hour), Number(minute)];
  const now = getDateTimeParts(context.timezone, context.referenceDate);
  const current = [now.year, now.month, now.day, now.hour, now.minute];

  for (let index = 0; index < event.length; index += 1) {
    if (event[index] !== current[index]) {
      return event[index]! > current[index]!;
    }
  }

  return false;
}

function inferSportFromTicket(rawText: string) {
  const normalizedText = rawText.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  return /⚽|futbol|corners?|fuera de juego|saque de banda|marcador\s*\(/.test(normalizedText)
    ? "Fútbol"
    : undefined;
}

function toExtractedTicket(value: unknown, rawText: string, context: TicketExtractionContext): ExtractedBetTicket {
  const parsed = aiTicketExtractionSchema.parse(value);
  const placedAtWasMissing = !parsed.placedAt || !hasDateInOcr(rawText);
  const preferredCurrency = preferredCurrencyFromContext(context);
  const currencyWasAssumed = Boolean(preferredCurrency && !hasExplicitCurrency(rawText));
  const inferredSport = inferSportFromTicket(rawText);
  const resultWasCorrected = isFutureScheduledEvent(rawText, context) && parsed.result !== BetResult.PENDING;
  return extractedBetTicketSchema.parse({
    ...parsed,
    placedAt: placedAtWasMissing ? undefined : parsed.placedAt ?? undefined,
    eventStartAt: parsed.eventStartAt ?? undefined,
    placedAtSource: placedAtWasMissing ? FieldSource.UNKNOWN : FieldSource.OCR,
    eventStartAtSource: parsed.eventStartAt ? FieldSource.OCR : FieldSource.UNKNOWN,
    currency: currencyWasAssumed ? preferredCurrency : parsed.currency,
    currencySource: currencyWasAssumed ? FieldSource.INFERRED : FieldSource.OCR,
    sport: parsed.sport ?? inferredSport,
    result: resultWasCorrected ? BetResult.PENDING : parsed.result,
    doubtfulFields: [
      ...new Set([
        ...parsed.doubtfulFields,
        ...(placedAtWasMissing ? ["placedAt"] : []),
        ...(!parsed.eventStartAt ? ["eventStartAt"] : []),
        ...(currencyWasAssumed ? ["currency"] : []),
        ...(resultWasCorrected ? ["result"] : []),
      ]),
    ],
    sportsbook: parsed.sportsbook ?? undefined,
    league: parsed.league ?? undefined,
    market: parsed.market ?? undefined,
    selection: parsed.selection ?? undefined,
    potentialPayout: parsed.potentialPayout ?? undefined,
    ticketCode: parsed.ticketCode ?? undefined,
    notes: parsed.notes ?? undefined,
    legs: parsed.legs.map((leg) => ({
      ...leg,
      sport: leg.sport ?? inferredSport,
      result: resultWasCorrected ? BetResult.PENDING : leg.result,
      league: leg.league ?? undefined,
      market: leg.market ?? undefined,
      selection: leg.selection ?? undefined,
      odds: leg.odds ?? undefined,
    })),
  });
}

function buildManualReviewTicket(note?: string, context: TicketExtractionContext = {}): ExtractedBetTicket {
  const preferredCurrency = preferredCurrencyFromContext(context) ?? "CLP";
  return extractedBetTicketSchema.parse({
    event: "Evento por confirmar",
    placedAt: undefined,
    eventStartAt: undefined,
    placedAtSource: FieldSource.UNKNOWN,
    eventStartAtSource: FieldSource.UNKNOWN,
    betType: BetType.SINGLE,
    stake: 0,
    odds: 1.01,
    currency: preferredCurrency,
    currencySource: FieldSource.INFERRED,
    result: BetResult.PENDING,
    netProfit: 0,
    confidenceScore: 0,
    doubtfulFields: [
      "event",
      "sportsbook",
      "placedAt",
      "eventStartAt",
      "sport",
      "league",
      "market",
      "selection",
      "betType",
      "stake",
      "odds",
      "currency",
      "potentialPayout",
      "ticketCode",
    ],
    notes: note ?? "Texto OCR disponible. Completa y revisa los campos antes de confirmar.",
    legs: [
      {
        event: "Evento por confirmar",
        result: BetResult.PENDING,
      },
    ],
  });
}

function isMockTicketText(rawText: string) {
  return rawText.trim().startsWith("Sportsbook:") && rawText.includes("Evento:") && rawText.includes("Stake:");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Error desconocido";
}

export async function parseTicketWithRouting(
  rawText: string,
  provider = getProvider(),
  context: TicketExtractionContext = {}
): Promise<TicketRoutingResult> {
  if (provider instanceof MockAiProvider) {
    const ticket = isMockTicketText(rawText) ? structureMockBetTicket(rawText) : buildManualReviewTicket(undefined, context);
    return { ticket, model: "mock-v1", estimatedTokens: Math.ceil(rawText.length / 4), fallbackUsed: false };
  }
  const cleanedText = sanitizeOcrText(rawText);
  const { ticketPrimary: primaryModel, ticketFallback: fallbackModel } = getAiModelConfig();
  const contextPrompt = [
    context.timezone ? `Zona horaria del usuario: ${context.timezone}.` : null,
    preferredCurrencyFromContext(context) ? `Moneda principal del usuario: ${preferredCurrencyFromContext(context)}. Úsala si el ticket solo muestra un símbolo monetario ambiguo o no declara moneda.` : null,
    `Fecha actual del usuario: ${formatCurrentDateTime(context.timezone, context.referenceDate).slice(0, 10)}.`,
    "Para placedAt entrega una fecha y hora local sin sufijo UTC solo si aparece en el OCR; nunca uses la hora actual.",
  ].filter(Boolean).join("\n");
  const request = (model: string) => provider.generateStructured({ task: "ticket_extraction", model, system: TICKET_SYSTEM_PROMPT, prompt: `${contextPrompt}\n\nTexto OCR (sin datos personales):\n${cleanedText}`, schemaName: "ticket_extraction", jsonSchema: aiTicketExtractionJsonSchema });
  const startedAt = Date.now();

  try {
    const primary = await request(primaryModel);
    const ticket = toExtractedTicket(primary.data, cleanedText, context);
    if (ticket.confidenceScore >= MIN_CONFIDENCE) {
      console.info("AI ticket extraction completed", {
        model: primary.model,
        fallbackUsed: false,
        elapsedMs: Date.now() - startedAt,
      });
      return { ticket, model: primary.model, estimatedTokens: primary.estimatedTokens, fallbackUsed: false };
    }
  } catch (error) {
    console.error("AI ticket extraction failed", {
      model: primaryModel,
      elapsedMs: Date.now() - startedAt,
      error: getErrorMessage(error),
    });
    return {
      ticket: buildManualReviewTicket("El texto OCR está disponible, pero la extracción estructurada no pudo completarse. Completa y revisa los campos antes de confirmar.", context),
      model: "manual-review",
      estimatedTokens: Math.ceil(cleanedText.length / 4),
      fallbackUsed: false,
    };
  }

  try {
    const fallback = await request(fallbackModel);
    const ticket = toExtractedTicket(fallback.data, cleanedText, context);
    console.info("AI ticket extraction completed", {
      model: fallback.model,
      fallbackUsed: true,
      elapsedMs: Date.now() - startedAt,
    });
    return {
      ticket,
      model: fallback.model,
      estimatedTokens: fallback.estimatedTokens,
      fallbackUsed: true,
    };
  } catch (fallbackError) {
    console.error("AI ticket extraction failed", {
      model: fallbackModel,
      elapsedMs: Date.now() - startedAt,
      error: getErrorMessage(fallbackError),
    });
    return {
      ticket: buildManualReviewTicket("El texto OCR está disponible, pero la extracción estructurada no pudo completarse. Completa y revisa los campos antes de confirmar.", context),
      model: "manual-review",
      estimatedTokens: Math.ceil(cleanedText.length / 4),
      fallbackUsed: true,
    };
  }
}

export const TICKET_REVIEW_CONFIDENCE = MIN_CONFIDENCE;
