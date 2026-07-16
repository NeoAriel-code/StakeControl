import { z } from "zod";
import { CURRENCY_CODES } from "@/lib/currencies";
import { BET_RESULT_OPTIONS, BET_TYPES } from "@/lib/bet-enums";

const optionalTrimmedString = z
  .string()
  .trim()
  .max(2_000, "El texto no puede superar 2000 caracteres.")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const optionalDateTime = optionalTrimmedString.refine(
  (value) => value === undefined || !Number.isNaN(new Date(value).getTime()),
  "La fecha y hora es inválida."
);

const decimalField = (label: string) =>
  z.coerce
    .number({
      error: `${label} es inválido.`,
    })
    .finite(`${label} es inválido.`);

export const betFormSchema = z.object({
  sportsbook: optionalTrimmedString,
  placedAt: optionalDateTime,
  eventStartAt: optionalDateTime,
  event: z.string().trim().min(1, "El evento es obligatorio.").max(300, "El evento no puede superar 300 caracteres."),
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
