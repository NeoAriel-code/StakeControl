import test from "node:test";
import assert from "node:assert/strict";
import {
  detectLossStreak,
  detectStakeIncrease,
  evaluateLimits,
  isPauseActiveAt,
} from "../src/lib/responsible-gaming-rules";

test("detectLossStreak triggers only for consecutive recent losses", () => {
  assert.deepEqual(detectLossStreak(["LOST", "LOST", "LOST", "LOST"]), {
    count: 4,
    triggered: true,
  });
  assert.deepEqual(detectLossStreak(["LOST", "WON", "LOST", "LOST"]), {
    count: 1,
    triggered: false,
  });
});

test("detectStakeIncrease compares recent average against historical average", () => {
  const increase = detectStakeIncrease([50, 50, 50, 50, 50, 10, 10, 10, 10, 10]);
  const stable = detectStakeIncrease([10, 12, 11, 10, 12, 11, 10, 12]);

  assert.equal(increase.triggered, true);
  assert.equal(increase.recentBetsConsidered, 5);
  assert.equal(stable.triggered, false);
});

test("evaluateLimits returns near, exceeded and pause statuses", () => {
  const now = new Date("2026-07-13T10:00:00.000Z");

  assert.equal(evaluateLimits({ currentValue: 79, limitValue: 100, referenceDate: now }), "WITHIN_LIMIT");
  assert.equal(evaluateLimits({ currentValue: 80, limitValue: 100, referenceDate: now }), "NEAR_LIMIT");
  assert.equal(evaluateLimits({ currentValue: 100, limitValue: 100, referenceDate: now }), "LIMIT_EXCEEDED");
  assert.equal(
    evaluateLimits({
      currentValue: 1,
      limitValue: 100,
      pauseUntil: new Date("2026-07-14T10:00:00.000Z"),
      referenceDate: now,
    }),
    "PAUSE_ACTIVE"
  );
});

test("isPauseActiveAt blocks active pauses and ignores expired pauses", () => {
  const now = new Date("2026-07-13T10:00:00.000Z");

  assert.equal(isPauseActiveAt(new Date("2026-07-13T10:01:00.000Z"), now), true);
  assert.equal(isPauseActiveAt(new Date("2026-07-13T09:59:00.000Z"), now), false);
});
