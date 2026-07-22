import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateAverageStake,
  calculateDashboardMetrics,
  calculateProfitLoss,
  calculateROI,
  calculateWinRate,
} from "../src/lib/dashboard-metrics";

test("critical metric helpers compute ROI, win rate, profit/loss and average stake", () => {
  assert.equal(calculateROI(25, 100), 25);
  assert.equal(calculateROI(-10, 50), -20);
  assert.equal(calculateROI(10, 0), 0);
  assert.equal(calculateWinRate([{ result: "WON" }, { result: "LOST" }, { result: "PENDING" }]), 50);
  assert.equal(calculateProfitLoss([{ profitLoss: 12.5 }, { profitLoss: -2.5 }, { profitLoss: null }]), 10);
  assert.equal(calculateAverageStake([{ stake: 10 }, { stake: 20 }, { stake: 30 }]), 20);
});

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

test("monthly totals use the supplied user timezone", () => {
  const metrics = calculateDashboardMetrics(
    [
      {
        id: "timezone-boundary",
        title: "Boundary",
        sport: "Football",
        market: "1X2",
        result: "WON",
        stake: 10,
        odds: 2,
        profitLoss: 10,
        placedAt: new Date("2026-07-01T02:30:00.000Z"),
      },
    ],
    "UTC"
  );

  assert.deepEqual(metrics.monthlyProfitLoss, [
    { month: "2026-07", profitLoss: 10 },
  ]);
});

test("calculateDashboardMetrics excludes pending values from realized performance", () => {
  const metrics = calculateDashboardMetrics([
    {
      id: "settled",
      title: "Ganada",
      result: "WON",
      stake: 50000,
      odds: 1.93,
      profitLoss: 46500,
      placedAt: new Date("2026-07-14T10:00:00.000Z"),
    },
    {
      id: "pending",
      title: "Pendiente",
      result: "PENDING",
      stake: 121286.7,
      odds: 21,
      profitLoss: 1212867,
      placedAt: new Date("2026-07-15T10:00:00.000Z"),
    },
  ]);

  assert.equal(metrics.stakeTotal, 171286.7);
  assert.equal(metrics.profitLossTotal, 46500);
  assert.equal(metrics.roiHistorical, 93);
  assert.deepEqual(metrics.monthlyProfitLoss, [
    { month: "2026-07", profitLoss: 46500 },
  ]);
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
