import { getHistoricalProfitLoss, isResolvedBetResult } from "@/lib/bet-outcomes";

export type PerformanceBet = {
  sport: string | null;
  market: string | null;
  result: string;
  stake: number;
  profitLoss: number;
};

function round(value: number) {
  return Number(value.toFixed(2));
}

function categoryName(bet: PerformanceBet) {
  return `${bet.sport?.trim() || "Sin deporte"} / ${bet.market?.trim() || "Sin mercado"}`;
}

export function buildPerformanceCategories(bets: PerformanceBet[]) {
  const resolved = bets.filter((bet) => isResolvedBetResult(bet.result));
  const counts = new Map<string, number>();
  for (const bet of resolved) {
    const name = categoryName(bet);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  const eligible = resolved.filter((bet) => (counts.get(categoryName(bet)) ?? 0) >= 20);
  const totalStake = eligible.reduce((sum, bet) => sum + bet.stake, 0);
  const grouped = new Map<string, { betCount: number; stake: number; profitLoss: number }>();

  for (const bet of eligible) {
    const name = categoryName(bet);
    const current = grouped.get(name) ?? { betCount: 0, stake: 0, profitLoss: 0 };
    grouped.set(name, {
      betCount: current.betCount + 1,
      stake: current.stake + bet.stake,
      profitLoss: current.profitLoss + getHistoricalProfitLoss(bet.result, bet.stake, bet.profitLoss),
    });
  }

  return Array.from(grouped.entries()).map(([name, category]) => ({
    name,
    betCount: category.betCount,
    stake: round(category.stake),
    exposurePct: totalStake ? round((category.stake / totalStake) * 100) : 0,
    profitLoss: round(category.profitLoss),
    roi: category.stake ? round((category.profitLoss / category.stake) * 100) : 0,
  }));
}
