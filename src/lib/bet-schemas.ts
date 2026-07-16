import { z } from "zod";
import { FieldSource } from "@prisma/client";
import { CURRENCY_CODES } from "@/lib/currencies";
import { BET_RESULT_OPTIONS, BET_TYPES } from "@/lib/bet-enums";

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const decimalField = (label: string) =>
  z.coerce
    .number({
      error: `${label} es inválido.`,
    })
    .finite(`${label} es inválido.`);

export const betFormSchema = z.object({
  sportsbook: optionalTrimmedString,
  placedAt: optionalTrimmedString,
  eventStartAt: optionalTrimmedString,
  placedAtSource: z.nativeEnum(FieldSource).optional(),
  eventStartAtSource: z.nativeEnum(FieldSource).optional(),
  event: z.string().trim().min(1, "El evento es obligatorio."),
  sport: optionalTrimmedString,
  league: optionalTrimmedString,
  market: optionalTrimmedString,
  selection: optionalTrimmedString,
  betType: z.enum(BET_TYPES, {
    error: "El tipo de apuesta es obligatorio.",
  }),
  stake: decimalField("El stake").refine((value) => value >= 0, {
    message: "El stake debe ser mayor o igual a 0.",
  }),
  odds: decimalField("La cuota").refine((value) => value > 1, {
    message: "La cuota debe ser mayor a 1.",
  }),
  currency: z.enum(CURRENCY_CODES, {
    error: "Selecciona una moneda válida.",
  }),
  currencySource: z.nativeEnum(FieldSource).optional(),
  potentialPayout: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    decimalField("El posible retorno").optional()
  ),
  result: z.enum(BET_RESULT_OPTIONS, {
    error: "El resultado es obligatorio.",
  }),
  netProfit: decimalField("La ganancia o pérdida neta"),
  ticketCode: optionalTrimmedString,
  notes: optionalTrimmedString,
});

export type BetFormValues = z.infer<typeof betFormSchema>;

export const betTypeOptions = BET_TYPES;
export const betResultOptions = BET_RESULT_OPTIONS;
