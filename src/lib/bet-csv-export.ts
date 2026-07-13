import type { UserPlan } from "@/lib/plans";

export type CsvExportBet = {
  placedAt: Date;
  sportsbook: string | null;
  sport: string | null;
  league: string | null;
  market: string | null;
  selection: string | null;
  betType: string;
  stake: string | number;
  odds: string | number;
  result: string;
  profitLoss: string | number | null;
  currency: string;
  ticketCode: string | null;
  notes: string | null;
  ticketImages?: Array<{
    aiExtraction?: {
      confidence: string | number | null;
    } | null;
  }>;
};

const BASIC_COLUMNS = [
  "fecha",
  "sportsbook",
  "deporte",
  "liga",
  "mercado",
  "seleccion",
  "tipo",
  "stake",
  "cuota",
  "resultado",
  "netProfit",
  "moneda",
];

const PREMIUM_COLUMNS = [
  "ticketCode",
  "notas",
  "categoria",
  "origen",
  "confidenceScore",
];

export function escapeCsvValue(value: string | number | null | undefined) {
  const normalized = value ?? "";
  return `"${String(normalized).replace(/"/g, '""')}"`;
}

function getCategory(bet: CsvExportBet) {
  const sport = bet.sport?.trim() || "Sin deporte";
  const market = bet.market?.trim() || "Sin mercado";
  return `${sport} / ${market}`;
}

function getOrigin(bet: CsvExportBet) {
  return bet.ticketImages?.length ? "OCR" : "manual";
}

function getConfidenceScore(bet: CsvExportBet) {
  const confidenceValues =
    bet.ticketImages
      ?.map((ticketImage) => ticketImage.aiExtraction?.confidence)
      .filter((confidence): confidence is string | number => confidence !== null && confidence !== undefined) ?? [];

  return confidenceValues[0] ?? "";
}

function getHeaders(plan: UserPlan) {
  return plan === "PREMIUM" ? [...BASIC_COLUMNS, ...PREMIUM_COLUMNS] : BASIC_COLUMNS;
}

function getRowValues(bet: CsvExportBet, plan: UserPlan) {
  const basicValues = [
    bet.placedAt.toISOString(),
    bet.sportsbook,
    bet.sport,
    bet.league,
    bet.market,
    bet.selection,
    bet.betType,
    bet.stake,
    bet.odds,
    bet.result,
    bet.profitLoss ?? 0,
    bet.currency,
  ];

  if (plan !== "PREMIUM") {
    return basicValues;
  }

  return [
    ...basicValues,
    bet.ticketCode,
    bet.notes,
    getCategory(bet),
    getOrigin(bet),
    getConfidenceScore(bet),
  ];
}

export function buildBetsCsv(bets: CsvExportBet[], plan: UserPlan) {
  const header = getHeaders(plan).map(escapeCsvValue).join(",");
  const lines = bets.map((bet) =>
    getRowValues(bet, plan).map((value) => escapeCsvValue(value)).join(",")
  );

  return [header, ...lines].join("\n");
}
