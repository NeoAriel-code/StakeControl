import { z } from "zod";
import { BET_RESULT_OPTIONS, BET_TYPES } from "@/lib/bet-enums";

const aiTicketLegSchema = z.object({
  event: z.string().min(1).nullable(),
  sport: z.string().nullable(),
  league: z.string().nullable(),
  market: z.string().nullable(),
  selection: z.string().nullable(),
  odds: z.number().finite().gt(1).nullable(),
  result: z.enum(BET_RESULT_OPTIONS).nullable(),
});

export const aiTicketExtractionSchema = z.object({
  sportsbook: z.string().nullable(),
  event: z.string().min(1).nullable(),
  placedAt: z.preprocess(
    (value) => (typeof value === "string" && value.trim().length === 0 ? null : value),
    z.string().min(1).nullable()
  ),
  eventStartAt: z.preprocess(
    (value) => (typeof value === "string" && value.trim().length === 0 ? null : value),
    z.string().min(1).nullable()
  ),
  sport: z.string().nullable(),
  league: z.string().nullable(),
  market: z.string().nullable(),
  selection: z.string().nullable(),
  betType: z.enum(BET_TYPES).nullable(),
  stake: z.number().finite().min(0).nullable(),
  odds: z.number().finite().gt(1).nullable(),
  currency: z.string().min(1).nullable(),
  potentialPayout: z.number().finite().nullable(),
  result: z.enum(BET_RESULT_OPTIONS).nullable(),
  netProfit: z.number().finite().nullable(),
  ticketCode: z.string().nullable(),
  notes: z.string().nullable(),
  confidenceScore: z.number().min(0).max(1).nullable(),
  doubtfulFields: z.array(z.string()).nullable(),
  legs: z.array(aiTicketLegSchema).min(1).max(20).nullable(),
});

export type AiTicketExtraction = z.infer<typeof aiTicketExtractionSchema>;

const aiTicketLegJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["event", "sport", "league", "market", "selection", "odds", "result"],
  properties: {
    event: { type: ["string", "null"] },
    sport: { type: ["string", "null"] },
    league: { type: ["string", "null"] },
    market: { type: ["string", "null"] },
    selection: { type: ["string", "null"] },
    odds: { type: ["number", "null"] },
    result: { type: ["string", "null"] },
  },
} as const;

export const aiTicketExtractionJsonSchema = {
  type: "object", additionalProperties: false,
  required: ["sportsbook", "event", "placedAt", "eventStartAt", "sport", "league", "market", "selection", "betType", "stake", "odds", "currency", "potentialPayout", "result", "netProfit", "ticketCode", "notes", "confidenceScore", "doubtfulFields", "legs"],
  properties: {
    sportsbook: { type: ["string", "null"] }, event: { type: ["string", "null"] }, placedAt: { type: ["string", "null"] }, eventStartAt: { type: ["string", "null"] }, sport: { type: ["string", "null"] }, league: { type: ["string", "null"] }, market: { type: ["string", "null"] }, selection: { type: ["string", "null"] },
    betType: { type: ["string", "null"] }, stake: { type: ["number", "null"] }, odds: { type: ["number", "null"] }, currency: { type: ["string", "null"] }, potentialPayout: { type: ["number", "null"] }, result: { type: ["string", "null"] }, netProfit: { type: ["number", "null"] }, ticketCode: { type: ["string", "null"] }, notes: { type: ["string", "null"] }, confidenceScore: { type: ["number", "null"] }, doubtfulFields: { type: ["array", "null"], items: { type: "string" } }, legs: { type: ["array", "null"], minItems: 1, maxItems: 20, items: aiTicketLegJsonSchema },
  },
} as const;
