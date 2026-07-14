import { z } from "zod";
import { BET_RESULT_OPTIONS, BET_TYPES } from "@/lib/bet-enums";

const aiTicketLegSchema = z.object({
  event: z.string().min(1),
  sport: z.string().nullable(),
  league: z.string().nullable(),
  market: z.string().nullable(),
  selection: z.string().nullable(),
  odds: z.number().finite().gt(1).nullable(),
  result: z.enum(BET_RESULT_OPTIONS),
});

export const aiTicketExtractionSchema = z.object({
  sportsbook: z.string().nullable(),
  event: z.string().min(1),
  placedAt: z.string().min(1),
  sport: z.string().nullable(),
  league: z.string().nullable(),
  market: z.string().nullable(),
  selection: z.string().nullable(),
  betType: z.enum(BET_TYPES),
  stake: z.number().finite().min(0),
  odds: z.number().finite().gt(1),
  currency: z.string().min(1),
  potentialPayout: z.number().finite().nullable(),
  result: z.enum(BET_RESULT_OPTIONS),
  netProfit: z.number().finite(),
  ticketCode: z.string().nullable(),
  notes: z.string().nullable(),
  confidenceScore: z.number().min(0).max(1),
  doubtfulFields: z.array(z.string()),
  legs: z.array(aiTicketLegSchema).min(1).max(20),
});

export type AiTicketExtraction = z.infer<typeof aiTicketExtractionSchema>;

const aiTicketLegJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["event", "sport", "league", "market", "selection", "odds", "result"],
  properties: {
    event: { type: "string" },
    sport: { type: ["string", "null"] },
    league: { type: ["string", "null"] },
    market: { type: ["string", "null"] },
    selection: { type: ["string", "null"] },
    odds: { type: ["number", "null"] },
    result: { type: "string", enum: BET_RESULT_OPTIONS },
  },
} as const;

export const aiTicketExtractionJsonSchema = {
  type: "object", additionalProperties: false,
  required: ["sportsbook", "event", "placedAt", "sport", "league", "market", "selection", "betType", "stake", "odds", "currency", "potentialPayout", "result", "netProfit", "ticketCode", "notes", "confidenceScore", "doubtfulFields", "legs"],
  properties: {
    sportsbook: { type: ["string", "null"] }, event: { type: "string" }, placedAt: { type: "string" }, sport: { type: ["string", "null"] }, league: { type: ["string", "null"] }, market: { type: ["string", "null"] }, selection: { type: ["string", "null"] },
    betType: { type: "string", enum: BET_TYPES }, stake: { type: "number" }, odds: { type: "number" }, currency: { type: "string" }, potentialPayout: { type: ["number", "null"] }, result: { type: "string", enum: BET_RESULT_OPTIONS }, netProfit: { type: "number" }, ticketCode: { type: ["string", "null"] }, notes: { type: ["string", "null"] }, confidenceScore: { type: "number" }, doubtfulFields: { type: "array", items: { type: "string" } }, legs: { type: "array", minItems: 1, maxItems: 20, items: aiTicketLegJsonSchema },
  },
} as const;
