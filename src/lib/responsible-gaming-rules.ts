export type LimitStatus = "WITHIN_LIMIT" | "NEAR_LIMIT" | "LIMIT_EXCEEDED" | "PAUSE_ACTIVE";

export function isPauseActiveAt(
  pauseUntil: Date | null | undefined,
  referenceDate = new Date()
) {
  return Boolean(pauseUntil && pauseUntil > referenceDate);
}

export function evaluateLimits({
  currentValue,
  limitValue,
  pauseUntil,
  referenceDate,
}: {
  currentValue: number;
  limitValue?: number | null;
  pauseUntil?: Date | null;
  referenceDate?: Date;
}): LimitStatus {
  if (isPauseActiveAt(pauseUntil, referenceDate)) {
    return "PAUSE_ACTIVE";
  }

  if (!limitValue || limitValue <= 0) {
    return "WITHIN_LIMIT";
  }

  const ratio = currentValue / limitValue;

  if (ratio >= 1) {
    return "LIMIT_EXCEEDED";
  }

  if (ratio >= 0.8) {
    return "NEAR_LIMIT";
  }

  return "WITHIN_LIMIT";
}

export function detectLossStreak(results: string[], threshold = 4) {
  let count = 0;

  for (const result of results) {
    if (result !== "LOST") {
      break;
    }

    count += 1;
  }

  return {
    count,
    triggered: count >= threshold,
  };
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function detectStakeIncrease(
  stakes: number[],
  options: { recentCount?: number; multiplier?: number } = {}
) {
  const recentCount = options.recentCount ?? 5;
  const multiplier = options.multiplier ?? 1.4;
  const recentStakes = stakes.slice(0, recentCount);
  const recentAverageStake = average(recentStakes);
  const historicalAverageStake = average(stakes);
  const triggered =
    recentStakes.length >= recentCount &&
    historicalAverageStake > 0 &&
    recentAverageStake > historicalAverageStake * multiplier;

  return {
    triggered,
    recentAverageStake,
    historicalAverageStake,
    recentBetsConsidered: recentStakes.length,
  };
}
