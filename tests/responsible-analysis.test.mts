import test from "node:test";
import assert from "node:assert/strict";
import { buildPerformanceCategories } from "../src/lib/resolved-performance-categories";

test("performance categories use resolved bets only and require twenty observations", () => {
  const bets = Array.from({ length: 20 }, (_, index) => ({
    id: String(index),
    sport: "Fútbol",
    market: "Ganador",
    result: "WON",
    stake: 10,
    profitLoss: 5,
    placedAt: new Date("2026-07-01T12:00:00.000Z"),
  }));

  const categories = buildPerformanceCategories([
    ...bets,
    {
      id: "pending",
      sport: "Fútbol",
      market: "Ganador",
      result: "PENDING",
      stake: 1_000,
      profitLoss: 0,
      placedAt: new Date("2026-07-02T12:00:00.000Z"),
    },
    {
      id: "small-sample",
      sport: "Tenis",
      market: "Ganador",
      result: "WON",
      stake: 10,
      profitLoss: 9,
      placedAt: new Date("2026-07-02T12:00:00.000Z"),
    },
  ]);

  assert.deepEqual(categories, [{
    name: "Fútbol / Ganador",
    betCount: 20,
    stake: 200,
    exposurePct: 100,
    profitLoss: 100,
    roi: 50,
  }]);
});
