export function isResolvedBetResult(result: string) {
  return result !== "PENDING" && result !== "UNKNOWN";
}

export function getRealizedProfitLoss(result: string, profitLoss: number | null | undefined) {
  return isResolvedBetResult(result) ? profitLoss ?? 0 : 0;
}
