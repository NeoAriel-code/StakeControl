export function isResolvedBetResult(result: string) {
  return result !== "PENDING" && result !== "UNKNOWN";
}

export function getHistoricalProfitLoss(
  result: string,
  stake: number,
  profitLoss: number | null | undefined
) {
  if (!isResolvedBetResult(result) || result === "VOID") {
    return 0;
  }

  if (result === "LOST") {
    return -Math.abs(stake);
  }

  return profitLoss ?? 0;
}

export function getQuickResultFinancials(input: {
  result: string;
  stake: number;
  odds: number;
  potentialPayout: number | null;
  settledPayout: number | null;
}) {
  const fallbackPayout = input.stake * input.odds;

  switch (input.result) {
    case "WON": {
      const settledPayout = input.potentialPayout ?? fallbackPayout;
      return { profitLoss: settledPayout - input.stake, settledPayout };
    }
    case "LOST":
      return { profitLoss: -input.stake, settledPayout: null };
    case "VOID":
      return { profitLoss: 0, settledPayout: input.stake };
    case "CASHOUT":
      return {
        profitLoss: input.settledPayout === null ? 0 : input.settledPayout - input.stake,
        settledPayout: input.settledPayout,
      };
    default:
      return { profitLoss: 0, settledPayout: null };
  }
}
