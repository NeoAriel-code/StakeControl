import { z } from "zod";
import { CURRENCY_CODES } from "@/lib/currencies";
import { BET_RESULT_OPTIONS, BET_TYPES } from "@/lib/bet-enums";

const optionalTrimmedString = (maxLength = 2_000) =>
  z
    .string()
    .trim()
    .max(maxLength, `El texto no puede superar ${maxLength} caracteres.`)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));

const optionalDateTime = optionalTrimmedString(25).refine(
  (value) => value === undefined || (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value) &&
    !Number.isNaN(new Date(value).getTime())
  ),
  "La fecha y hora es inválida."
);

const decimalField = (label: string) =>
  z.coerce
    .number({
      error: `${label} es inválido.`,
    })
    .finite(`${label} es inválido.`);

export const betFormSchema = z.object({
  sportsbook: optionalTrimmedString(120),
  placedAt: optionalDateTime,
  eventStartAt: optionalDateTime,
  event: z.string().trim().min(1, "El evento es obligatorio.").max(300, "El evento no puede superar 300 caracteres."),
  sport: optionalTrimmedString(80),
  league: optionalTrimmedString(120),
  market: optionalTrimmedString(160),
  selection: optionalTrimmedString(160),
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
  potentialPayout: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    decimalField("El posible retorno").optional()
  ),
  result: z.enum(BET_RESULT_OPTIONS, {
    error: "El resultado es obligatorio.",
  }),
  netProfit: decimalField("La ganancia o pérdida neta"),
  ticketCode: optionalTrimmedString(120),
  notes: optionalTrimmedString(2_000),
});

export type BetFormValues = z.infer<typeof betFormSchema>;

export const betTypeOptions = BET_TYPES;
export const betResultOptions = BET_RESULT_OPTIONS;
