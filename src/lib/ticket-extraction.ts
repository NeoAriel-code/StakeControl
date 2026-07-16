import { BetResult, FieldSource } from "@prisma/client";
import { z } from "zod";
import { BET_RESULT_OPTIONS, BET_TYPES } from "@/lib/bet-enums";

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const ticketLegSchema = z.object({
  event: z.string().trim().min(1, "El evento de la selección es obligatorio."),
  sport: optionalString,
  league: optionalString,
  market: optionalString,
  selection: optionalString,
  odds: z.coerce.number().finite().gt(1).optional(),
  result: z.enum(BET_RESULT_OPTIONS).default(BetResult.PENDING),
});

export type TicketLeg = z.infer<typeof ticketLegSchema>;

export const extractedBetTicketSchema = z.object({
  sportsbook: optionalString,
  event: z.string().trim().min(1, "El evento detectado es obligatorio."),
  placedAt: optionalString,
  eventStartAt: optionalString,
  placedAtSource: z.nativeEnum(FieldSource).optional(),
  eventStartAtSource: z.nativeEnum(FieldSource).optional(),
  sport: optionalString,
  league: optionalString,
  market: optionalString,
  selection: optionalString,
  betType: z.enum(BET_TYPES),
  stake: z.coerce.number().finite().min(0),
  odds: z.coerce.number().finite().gt(1),
  currency: z.string().trim().min(1),
  currencySource: z.nativeEnum(FieldSource).optional(),
  potentialPayout: z.coerce.number().finite().optional(),
  result: z.enum(BET_RESULT_OPTIONS).default(BetResult.PENDING),
  netProfit: z.coerce.number().finite().default(0),
  ticketCode: optionalString,
  notes: optionalString,
  confidenceScore: z.coerce.number().finite().min(0).max(1),
  doubtfulFields: z.array(z.string().trim().min(1)).default([]),
  legs: z.array(ticketLegSchema).max(20).default([]),
});

export type ExtractedBetTicket = z.infer<typeof extractedBetTicketSchema>;

export const reviewedTicketBetSchema = extractedBetTicketSchema.extend({
  confidenceScore: z.coerce.number().finite().min(0).max(1),
  doubtfulFields: z.array(z.string()).default([]),
});

export type ReviewedTicketBetValues = z.infer<typeof reviewedTicketBetSchema>;
