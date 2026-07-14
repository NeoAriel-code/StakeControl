import type { AiProvider } from "@/lib/ai/ai-provider";
import { BetResult, BetType } from "@prisma/client";
import { MockAiProvider } from "@/lib/ai/mock-ai-provider";
import { OpenAiProvider } from "@/lib/ai/openai-provider";
import { getAiModelConfig } from "@/lib/ai/ai-config";
import { aiTicketExtractionJsonSchema, aiTicketExtractionSchema } from "@/lib/ai/schemas/ticket-extraction.schema";
import { CURRENCY_CODES, isSupportedCurrency } from "@/lib/currencies";
import { extractedBetTicketSchema, type ExtractedBetTicket } from "@/lib/ticket-extraction";
import { structureMockBetTicket } from "@/lib/mock-ticket-parser";

const MIN_CONFIDENCE = 0.85;
const TICKET_SYSTEM_PROMPT = "Extrae exclusivamente datos ya presentes en el texto OCR. No inventes valores: usa null para campos opcionales desconocidos; si no está la fecha, usa null en placedAt, baja confidenceScore y agrega placedAt en doubtfulFields. Si un icono o un mercado inequívoco identifica el deporte, úsalo; de lo contrario usa null. Incluye cada selección en legs: una simple tiene una; una múltiple tiene dos o más, normalmente de eventos distintos; un Bet Builder tiene dos o más del mismo evento y usa betType BET_BUILDER. La cuota principal es la cuota total del ticket; cada pierna puede no tener cuota. Esto solo prepara una revisión humana; nunca recomienda apuestas ni decisiones.";

export type TicketRoutingResult = { ticket: ExtractedBetTicket; model: string; estimatedTokens: number; fallbackUsed: boolean };
export type TicketExtractionContext = {
  preferredCurrency?: string;
  timezone?: string;
};

function getProvider(): AiProvider {
  return process.env.AI_PROVIDER?.trim().toLowerCase() === "openai" ? new OpenAiProvider() : new MockAiProvider();
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

function formatCurrentDateTime(timezone?: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const getPart = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
    return `${getPart("year")}-${getPart("month")}-${getPart("day")}T${getPart("hour")}:${getPart("minute")}`;
  } catch {
    return new Date().toISOString().slice(0, 16);
  }
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
  return extractedBetTicketSchema.parse({
    ...parsed,
    placedAt: placedAtWasMissing ? formatCurrentDateTime(context.timezone) : parsed.placedAt ?? formatCurrentDateTime(context.timezone),
    currency: currencyWasAssumed ? preferredCurrency : parsed.currency,
    sport: parsed.sport ?? inferredSport,
    doubtfulFields: [
      ...new Set([
        ...parsed.doubtfulFields,
        ...(placedAtWasMissing ? ["placedAt"] : []),
        ...(currencyWasAssumed ? ["currency"] : []),
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
    placedAt: formatCurrentDateTime(context.timezone),
    betType: BetType.SINGLE,
    stake: 0,
    odds: 1.01,
    currency: preferredCurrency,
    result: BetResult.PENDING,
    netProfit: 0,
    confidenceScore: 0,
    doubtfulFields: [
      "event",
      "sportsbook",
      "placedAt",
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
