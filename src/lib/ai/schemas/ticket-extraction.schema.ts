import { BetResult, BetType } from "@prisma/client";
import { z } from "zod";

export const aiTicketExtractionSchema = z.object({
  sportsbook: z.string().nullable(),
  event: z.string().min(1),
  placedAt: z.string().min(1),
  sport: z.string().nullable(),
  league: z.string().nullable(),
  market: z.string().nullable(),
  selection: z.string().nullable(),
  betType: z.nativeEnum(BetType),
  stake: z.number().finite().min(0),
  odds: z.number().finite().gt(1),
  currency: z.string().min(1),
  potentialPayout: z.number().finite().nullable(),
  result: z.nativeEnum(BetResult),
  netProfit: z.number().finite(),
  ticketCode: z.string().nullable(),
  notes: z.string().nullable(),
  confidenceScore: z.number().min(0).max(1),
  doubtfulFields: z.array(z.string()),
});

export type AiTicketExtraction = z.infer<typeof aiTicketExtractionSchema>;

export const aiTicketExtractionJsonSchema = {
  type: "object", additionalProperties: false,
  required: ["sportsbook", "event", "placedAt", "sport", "league", "market", "selection", "betType", "stake", "odds", "currency", "potentialPayout", "result", "netProfit", "ticketCode", "notes", "confidenceScore", "doubtfulFields"],
  properties: {
    sportsbook: { type: ["string", "null"] }, event: { type: "string" }, placedAt: { type: "string" }, sport: { type: ["string", "null"] }, league: { type: ["string", "null"] }, market: { type: ["string", "null"] }, selection: { type: ["string", "null"] },
    betType: { type: "string", enum: Object.values(BetType) }, stake: { type: "number" }, odds: { type: "number" }, currency: { type: "string" }, potentialPayout: { type: ["number", "null"] }, result: { type: "string", enum: Object.values(BetResult) }, netProfit: { type: "number" }, ticketCode: { type: ["string", "null"] }, notes: { type: ["string", "null"] }, confidenceScore: { type: "number" }, doubtfulFields: { type: "array", items: { type: "string" } },
  },
} as const;
