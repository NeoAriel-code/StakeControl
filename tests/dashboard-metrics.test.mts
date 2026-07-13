import test from "node:test";
import assert from "node:assert/strict";
import { calculateDashboardMetrics } from "../src/lib/dashboard-metrics";

test("calculateDashboardMetrics computes historical formulas correctly", () => {
  const metrics = calculateDashboardMetrics([
    {
      id: "1",
      title: "A",
      sport: "Football",
      market: "1X2",
      result: "WON",
      stake: 100,
      odds: 2,
      profitLoss: 50,
      placedAt: new Date("2026-01-10T10:00:00.000Z"),
    },
    {
      id: "2",
      title: "B",
      sport: "Football",
      market: "Over 2.5",
      result: "LOST",
      stake: 50,
      odds: 1.5,
      profitLoss: -50,
      placedAt: new Date("2026-01-11T10:00:00.000Z"),
    },
    {
      id: "3",
      title: "C",
      sport: "Tennis",
      market: "Moneyline",
      result: "PENDING",
      stake: 25,
      odds: 1.8,
      profitLoss: 0,
      placedAt: new Date("2026-02-01T10:00:00.000Z"),
    },
  ]);

  assert.equal(metrics.profitLossTotal, 0);
  assert.equal(metrics.stakeTotal, 175);
  assert.equal(metrics.roiHistorical, 0);
  assert.equal(metrics.winRate, 50);
  assert.equal(metrics.averageStake, 58.33);
  assert.equal(metrics.averageOdds, 1.77);
  assert.equal(metrics.betCount, 3);
  assert.equal(metrics.resolvedBetsCount, 2);
  assert.equal(metrics.winningBetsCount, 1);
  assert.equal(metrics.currentWinningStreak, 0);
  assert.equal(metrics.currentLosingStreak, 1);
  assert.deepEqual(metrics.monthlyProfitLoss, [
    { month: "2026-01", profitLoss: 0 },
    { month: "2026-02", profitLoss: 0 },
  ]);
  assert.equal(metrics.sportExposure[0]?.name, "Football");
  assert.equal(metrics.sportExposure[0]?.exposurePct, 85.71);
  assert.equal(metrics.marketExposure[0]?.name, "1X2");
});

test("calculateDashboardMetrics handles zero divisions safely", () => {
  const metrics = calculateDashboardMetrics([]);

  assert.equal(metrics.profitLossTotal, 0);
  assert.equal(metrics.stakeTotal, 0);
  assert.equal(metrics.roiHistorical, 0);
  assert.equal(metrics.winRate, 0);
  assert.equal(metrics.averageStake, 0);
  assert.equal(metrics.averageOdds, 0);
  assert.equal(metrics.currentWinningStreak, 0);
  assert.equal(metrics.currentLosingStreak, 0);
  assert.deepEqual(metrics.monthlyProfitLoss, []);
  assert.deepEqual(metrics.sportExposure, []);
  assert.deepEqual(metrics.marketExposure, []);
});

test("calculateDashboardMetrics computes winning streak from latest resolved bets", () => {
  const metrics = calculateDashboardMetrics([
    {
      id: "1",
      title: "A",
      sport: "Football",
      market: "1X2",
      result: "WON",
      stake: 10,
      odds: 2,
      profitLoss: 10,
      placedAt: new Date("2026-02-03T10:00:00.000Z"),
    },
    {
      id: "2",
      title: "B",
      sport: "Football",
      market: "1X2",
      result: "WON",
      stake: 10,
      odds: 2,
      profitLoss: 10,
      placedAt: new Date("2026-02-02T10:00:00.000Z"),
    },
    {
      id: "3",
      title: "C",
      sport: "Football",
      market: "1X2",
      result: "LOST",
      stake: 10,
      odds: 2,
      profitLoss: -10,
      placedAt: new Date("2026-02-01T10:00:00.000Z"),
    },
  ]);

  assert.equal(metrics.currentWinningStreak, 2);
  assert.equal(metrics.currentLosingStreak, 0);
});
