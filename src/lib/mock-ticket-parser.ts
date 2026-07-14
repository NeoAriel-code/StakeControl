import { BetResult, BetType } from "@prisma/client";
import {
  extractedBetTicketSchema,
  type ExtractedBetTicket,
} from "@/lib/ticket-extraction";

function readLine(rawText: string, prefix: string) {
  const line = rawText
    .split("\n")
    .find((entry) => entry.toLowerCase().startsWith(`${prefix.toLowerCase()}:`));

  return line ? line.split(":").slice(1).join(":").trim() : undefined;
}

function parseCurrencyValue(value: string | undefined) {
  if (!value) return undefined;
  const numeric = Number(value.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(numeric) ? numeric : undefined;
}

export function structureMockBetTicket(rawText: string): ExtractedBetTicket {
  const sportsbook = readLine(rawText, "Sportsbook");
  const event = readLine(rawText, "Evento") || "Evento sin detectar";
  const sport = readLine(rawText, "Deporte");
  const league = readLine(rawText, "Liga");
  const market = readLine(rawText, "Mercado");
  const selection = readLine(rawText, "Seleccion");
  const ticketCode = readLine(rawText, "Codigo ticket");
  const placedAt = readLine(rawText, "Fecha") || new Date().toISOString().slice(0, 16);
  const stake = parseCurrencyValue(readLine(rawText, "Stake")) ?? 15000;
  const odds = Number(readLine(rawText, "Cuota") || "2.35");
  const potentialPayout = parseCurrencyValue(readLine(rawText, "Posible retorno"));
  const confidenceScore = rawText.toLowerCase().includes("betano") ? 0.91 : 0.79;
  const doubtfulFields = confidenceScore < 0.85 ? ["league", "selection"] : ["market"];

  return extractedBetTicketSchema.parse({
    sportsbook,
    event,
    placedAt,
    sport,
    league,
    market,
    selection,
    betType: BetType.SINGLE,
    stake,
    odds,
    currency: "CLP",
    potentialPayout,
    result: BetResult.PENDING,
    netProfit: 0,
    ticketCode,
    notes: "Extracción generada por proveedor mock.",
    confidenceScore,
    doubtfulFields,
    legs: [
      {
        event,
        sport,
        league,
        market,
        selection,
        odds,
        result: BetResult.PENDING,
      },
    ],
  });
}
