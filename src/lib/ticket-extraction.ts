import { BetResult, BetType } from "@prisma/client";
import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const extractedBetTicketSchema = z.object({
  sportsbook: optionalString,
  event: z.string().trim().min(1, "El evento detectado es obligatorio."),
  placedAt: z.string().trim().min(1, "La fecha detectada es obligatoria."),
  sport: optionalString,
  league: optionalString,
  market: optionalString,
  selection: optionalString,
  betType: z.nativeEnum(BetType),
  stake: z.coerce.number().finite().min(0),
  odds: z.coerce.number().finite().gt(1),
  currency: z.string().trim().min(1),
  potentialPayout: z.coerce.number().finite().optional(),
  result: z.nativeEnum(BetResult).default(BetResult.PENDING),
  netProfit: z.coerce.number().finite().default(0),
  ticketCode: optionalString,
  notes: optionalString,
  confidenceScore: z.coerce.number().finite().min(0).max(1),
  doubtfulFields: z.array(z.string().trim().min(1)).default([]),
});

export type ExtractedBetTicket = z.infer<typeof extractedBetTicketSchema>;

export const reviewedTicketBetSchema = extractedBetTicketSchema.extend({
  confidenceScore: z.coerce.number().finite().min(0).max(1),
  doubtfulFields: z.array(z.string()).default([]),
});

export type ReviewedTicketBetValues = z.infer<typeof reviewedTicketBetSchema>;
