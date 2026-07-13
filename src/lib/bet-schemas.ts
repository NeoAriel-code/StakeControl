import { BetResult, BetType } from "@prisma/client";
import { z } from "zod";
import { CURRENCY_CODES } from "@/lib/currencies";

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
  placedAt: z
    .string()
    .trim()
    .min(1, "La fecha y hora es obligatoria."),
  event: z.string().trim().min(1, "El evento es obligatorio."),
  sport: optionalTrimmedString,
  league: optionalTrimmedString,
  market: optionalTrimmedString,
  selection: optionalTrimmedString,
  betType: z.nativeEnum(BetType, {
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
  result: z.nativeEnum(BetResult, {
    error: "El resultado es obligatorio.",
  }),
  netProfit: decimalField("La ganancia o pérdida neta"),
  ticketCode: optionalTrimmedString,
  notes: optionalTrimmedString,
});

export type BetFormValues = z.infer<typeof betFormSchema>;

export const betTypeOptions = Object.values(BetType);
export const betResultOptions = Object.values(BetResult);
