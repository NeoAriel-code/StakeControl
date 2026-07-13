export type OddsFormatPreference = "DECIMAL" | "AMERICAN";

export function decimalToAmericanOdds(decimalOdds: number) {
  if (!Number.isFinite(decimalOdds) || decimalOdds <= 1) {
    return "—";
  }

  if (decimalOdds >= 2) {
    return `+${Math.round((decimalOdds - 1) * 100)}`;
  }

  return `${Math.round(-100 / (decimalOdds - 1))}`;
}

export function formatOdds(decimalOdds: number, oddsFormat: OddsFormatPreference = "DECIMAL") {
  if (!Number.isFinite(decimalOdds) || decimalOdds <= 1) {
    return "—";
  }

  if (oddsFormat === "AMERICAN") {
    return decimalToAmericanOdds(decimalOdds);
  }

  return decimalOdds.toFixed(2);
}
