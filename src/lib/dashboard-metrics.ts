export type MetricBet = {
  id: string;
  title: string;
  sport?: string | null;
  market?: string | null;
  result: string;
  stake: number;
  odds: number;
  profitLoss?: number | null;
  placedAt: Date;
};

export type DashboardMetrics = {
  profitLossTotal: number;
  stakeTotal: number;
  roiHistorical: number;
  winRate: number;
  averageStake: number;
  averageOdds: number;
  betCount: number;
  currentWinningStreak: number;
  currentLosingStreak: number;
  monthlyProfitLoss: Array<{
    month: string;
    profitLoss: number;
  }>;
  sportExposure: Array<{
    name: string;
    stake: number;
    exposurePct: number;
  }>;
  marketExposure: Array<{
    name: string;
    stake: number;
    exposurePct: number;
  }>;
  resolvedBetsCount: number;
  winningBetsCount: number;
};

function round(value: number, decimals = 2) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Number(value.toFixed(decimals));
}

function safeDivide(numerator: number, denominator: number) {
  if (!denominator) {
    return 0;
  }

  return numerator / denominator;
}

export function calculateProfitLoss(bets: Array<Pick<MetricBet, "profitLoss">>) {
  return round(bets.reduce((sum, bet) => sum + (bet.profitLoss ?? 0), 0));
}

export function calculateROI(profitLoss: number, stakeTotal: number) {
  return round(safeDivide(profitLoss, stakeTotal) * 100);
}

export function calculateWinRate(results: Array<Pick<MetricBet, "result">>) {
  const resolvedBets = results.filter((bet) => isResolvedResult(bet.result));
  const winningBets = resolvedBets.filter((bet) => bet.result === "WON");

  return round(safeDivide(winningBets.length, resolvedBets.length) * 100);
}

export function calculateAverageStake(bets: Array<Pick<MetricBet, "stake">>) {
  return round(safeDivide(
    bets.reduce((sum, bet) => sum + bet.stake, 0),
    bets.length
  ));
}

function isResolvedResult(result: string) {
  return result !== "PENDING" && result !== "UNKNOWN";
}

function buildExposure(
  bets: MetricBet[],
  selector: (bet: MetricBet) => string | null | undefined
) {
  const grouped = new Map<string, number>();
  const stakeTotal = bets.reduce((sum, bet) => sum + bet.stake, 0);

  for (const bet of bets) {
    const key = selector(bet)?.trim() || "Sin categoría";
    grouped.set(key, (grouped.get(key) ?? 0) + bet.stake);
  }

  return Array.from(grouped.entries())
    .map(([name, stake]) => ({
      name,
      stake: round(stake),
      exposurePct: round(safeDivide(stake, stakeTotal) * 100),
    }))
    .sort((a, b) => b.stake - a.stake);
}

function buildMonthlyProfitLoss(bets: MetricBet[]) {
  const grouped = new Map<string, number>();

  const ordered = [...bets].sort((a, b) => a.placedAt.getTime() - b.placedAt.getTime());

  for (const bet of ordered) {
    const monthKey = `${bet.placedAt.getFullYear()}-${String(bet.placedAt.getMonth() + 1).padStart(2, "0")}`;
    grouped.set(monthKey, (grouped.get(monthKey) ?? 0) + (bet.profitLoss ?? 0));
  }

  return Array.from(grouped.entries()).map(([month, profitLoss]) => ({
    month,
    profitLoss: round(profitLoss),
  }));
}

function buildCurrentStreak(bets: MetricBet[], targetResult: "WON" | "LOST") {
  const resolvedForStreak = [...bets]
    .filter((bet) => bet.result === "WON" || bet.result === "LOST")
    .sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime());

  let streak = 0;

  for (const bet of resolvedForStreak) {
    if (bet.result === targetResult) {
      streak += 1;
      continue;
    }

    break;
  }

  return streak;
}

export function calculateDashboardMetrics(bets: MetricBet[]): DashboardMetrics {
  const betCount = bets.length;
  const profitLossTotal = calculateProfitLoss(bets);
  const stakeTotal = round(bets.reduce((sum, bet) => sum + bet.stake, 0));
  const averageStake = calculateAverageStake(bets);
  const averageOdds = round(
    safeDivide(
      bets.reduce((sum, bet) => sum + bet.odds, 0),
      betCount
    )
  );

  const resolvedBets = bets.filter((bet) => isResolvedResult(bet.result));
  const winningBets = resolvedBets.filter((bet) => bet.result === "WON");

  return {
    profitLossTotal,
    stakeTotal,
    roiHistorical: calculateROI(profitLossTotal, stakeTotal),
    winRate: calculateWinRate(bets),
    averageStake,
    averageOdds,
    betCount,
    currentWinningStreak: buildCurrentStreak(bets, "WON"),
    currentLosingStreak: buildCurrentStreak(bets, "LOST"),
    monthlyProfitLoss: buildMonthlyProfitLoss(bets),
    sportExposure: buildExposure(bets, (bet) => bet.sport),
    marketExposure: buildExposure(bets, (bet) => bet.market),
    resolvedBetsCount: resolvedBets.length,
    winningBetsCount: winningBets.length,
  };
}
