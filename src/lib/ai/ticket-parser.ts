import type { AiProvider } from "@/lib/ai/ai-provider";
import { BetResult, BetType } from "@prisma/client";
import { MockAiProvider } from "@/lib/ai/mock-ai-provider";
import { OpenAiProvider } from "@/lib/ai/openai-provider";
import { getAiModelConfig } from "@/lib/ai/ai-config";
import { aiTicketExtractionJsonSchema, aiTicketExtractionSchema } from "@/lib/ai/schemas/ticket-extraction.schema";
import { extractedBetTicketSchema, type ExtractedBetTicket } from "@/lib/ticket-extraction";
import { structureMockBetTicket } from "@/lib/mock-ticket-parser";

const MIN_CONFIDENCE = 0.85;
const TICKET_SYSTEM_PROMPT = "Extrae exclusivamente datos ya presentes en el texto OCR. No inventes valores: usa valores seguros, baja confidenceScore y agrega doubtfulFields cuando falte un dato. Incluye cada selección en legs: una simple tiene una; una múltiple tiene dos o más, normalmente de eventos distintos; un Bet Builder tiene dos o más del mismo evento y usa betType BET_BUILDER. La cuota principal es la cuota total del ticket; cada pierna puede no tener cuota. Esto solo prepara una revisión humana; nunca recomienda apuestas ni decisiones.";

export type TicketRoutingResult = { ticket: ExtractedBetTicket; model: string; estimatedTokens: number; fallbackUsed: boolean };

function getProvider(): AiProvider {
  return process.env.AI_PROVIDER?.trim().toLowerCase() === "openai" ? new OpenAiProvider() : new MockAiProvider();
}

function sanitizeOcrText(rawText: string) {
  return rawText
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL_REDACTED]")
    .replace(/\b\d{1,2}\.\d{3}\.\d{3}-[0-9Kk]\b/g, "[RUT_REDACTED]")
    .replace(/^(nombre|cliente|titular)\s*:.+$/gim, "$1: [NAME_REDACTED]");
}

function toExtractedTicket(value: unknown): ExtractedBetTicket {
  const parsed = aiTicketExtractionSchema.parse(value);
  return extractedBetTicketSchema.parse({
    ...parsed,
    sportsbook: parsed.sportsbook ?? undefined,
    sport: parsed.sport ?? undefined,
    league: parsed.league ?? undefined,
    market: parsed.market ?? undefined,
    selection: parsed.selection ?? undefined,
    potentialPayout: parsed.potentialPayout ?? undefined,
    ticketCode: parsed.ticketCode ?? undefined,
    notes: parsed.notes ?? undefined,
    legs: parsed.legs.map((leg) => ({
      ...leg,
      sport: leg.sport ?? undefined,
      league: leg.league ?? undefined,
      market: leg.market ?? undefined,
      selection: leg.selection ?? undefined,
      odds: leg.odds ?? undefined,
    })),
  });
}

function buildManualReviewTicket(note?: string): ExtractedBetTicket {
  return extractedBetTicketSchema.parse({
    event: "Evento por confirmar",
    placedAt: new Date().toISOString().slice(0, 16),
    betType: BetType.UNKNOWN,
    stake: 0,
    odds: 1.01,
    currency: "CLP",
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

export async function parseTicketWithRouting(rawText: string, provider = getProvider()): Promise<TicketRoutingResult> {
  if (provider instanceof MockAiProvider) {
    const ticket = isMockTicketText(rawText) ? structureMockBetTicket(rawText) : buildManualReviewTicket();
    return { ticket, model: "mock-v1", estimatedTokens: Math.ceil(rawText.length / 4), fallbackUsed: false };
  }
  const cleanedText = sanitizeOcrText(rawText);
  const { ticketPrimary: primaryModel, ticketFallback: fallbackModel } = getAiModelConfig();
  const request = (model: string) => provider.generateStructured({ task: "ticket_extraction", model, system: TICKET_SYSTEM_PROMPT, prompt: `Texto OCR (sin datos personales):\n${cleanedText}`, schemaName: "ticket_extraction", jsonSchema: aiTicketExtractionJsonSchema });
  try {
    const primary = await request(primaryModel);
    let ticket = toExtractedTicket(primary.data);
    if (ticket.confidenceScore >= MIN_CONFIDENCE) {
      return { ticket, model: primary.model, estimatedTokens: primary.estimatedTokens, fallbackUsed: false };
    }

    const fallback = await request(fallbackModel);
    ticket = toExtractedTicket(fallback.data);
    return {
      ticket,
      model: fallback.model,
      estimatedTokens: primary.estimatedTokens + fallback.estimatedTokens,
      fallbackUsed: true,
    };
  } catch {
    return {
      ticket: buildManualReviewTicket(
        "El texto OCR está disponible, pero la extracción estructurada no pudo completarse. Completa y revisa los campos antes de confirmar."
      ),
      model: "manual-review",
      estimatedTokens: Math.ceil(cleanedText.length / 4),
      fallbackUsed: true,
    };
  }
}

export const TICKET_REVIEW_CONFIDENCE = MIN_CONFIDENCE;
