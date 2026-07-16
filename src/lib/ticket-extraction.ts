import { BetResult, FieldSource } from "@prisma/client";
import { z } from "zod";
import { BET_RESULT_OPTIONS, BET_TYPES } from "@/lib/bet-enums";

const optionalString = (maxLength = 2_000) =>
  z
    .string()
    .trim()
    .max(maxLength, `El texto no puede superar ${maxLength} caracteres.`)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));

const optionalDateTime = optionalString(25).refine(
  (value) => value === undefined || (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value) &&
    !Number.isNaN(new Date(value).getTime())
  ),
  "La fecha y hora es inválida."
);

export const ticketLegSchema = z.object({
  event: z.string().trim().min(1, "El evento de la selección es obligatorio.").max(300),
  sport: optionalString(80),
  league: optionalString(120),
  market: optionalString(160),
  selection: optionalString(160),
  odds: z.coerce.number().finite().gt(1).optional(),
  result: z.enum(BET_RESULT_OPTIONS).default(BetResult.PENDING),
});

export type TicketLeg = z.infer<typeof ticketLegSchema>;

export const extractedBetTicketSchema = z.object({
  sportsbook: optionalString(120),
  event: z.string().trim().min(1, "El evento detectado es obligatorio."),
  placedAt: optionalDateTime,
  eventStartAt: optionalDateTime,
  placedAtSource: z.nativeEnum(FieldSource).optional(),
  eventStartAtSource: z.nativeEnum(FieldSource).optional(),
  sport: optionalString(80),
  league: optionalString(120),
  market: optionalString(160),
  selection: optionalString(160),
  betType: z.enum(BET_TYPES),
  stake: z.coerce.number().finite().min(0),
  odds: z.coerce.number().finite().gt(1),
  currency: z.string().trim().min(1).max(12),
  currencySource: z.nativeEnum(FieldSource).optional(),
  potentialPayout: z.coerce.number().finite().optional(),
  result: z.enum(BET_RESULT_OPTIONS).default(BetResult.PENDING),
  netProfit: z.coerce.number().finite().default(0),
  ticketCode: optionalString(120),
  notes: optionalString(2_000),
  confidenceScore: z.coerce.number().finite().min(0).max(1),
  doubtfulFields: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  legs: z.array(ticketLegSchema).max(20).default([]),
});

export type ExtractedBetTicket = z.infer<typeof extractedBetTicketSchema>;

export const reviewedTicketBetSchema = extractedBetTicketSchema.extend({
  confidenceScore: z.coerce.number().finite().min(0).max(1),
  doubtfulFields: z.array(z.string()).default([]),
});

export type ReviewedTicketBetValues = z.infer<typeof reviewedTicketBetSchema>;
