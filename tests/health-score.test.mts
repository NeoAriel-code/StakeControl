import test from "node:test";
import assert from "node:assert/strict";
import { calculateResponsibleHealth } from "../src/lib/health-score";

const baseInput = {
  betCount: 30,
  currentLosingStreak: 0,
  sportExposure: [{ name: "Fútbol", exposurePct: 45 }],
  marketExposure: [{ name: "Resultado", exposurePct: 35 }],
  dailyLimit: { current: 10, limit: 100 },
  weeklyLimit: { current: 100, limit: 500 },
  monthlyLimit: { current: 400, limit: 2000 },
  pauseActive: false,
  unreadAlertCount: 0,
  highSeverityAlertCount: 0,
};

test("calculateResponsibleHealth returns controlled status for stable historical data", () => {
  const health = calculateResponsibleHealth(baseInput);

  assert.equal(health.status, "controlled");
  assert.equal(health.score, 100);
  assert.equal(health.signals[0]?.id, "stable");
});

test("calculateResponsibleHealth flags exceeded limits", () => {
  const health = calculateResponsibleHealth({
    ...baseInput,
    monthlyLimit: { current: 2100, limit: 2000 },
  });

  assert.equal(health.status, "limit-exceeded");
  assert.ok(health.score < 80);
  assert.ok(health.signals.some((signal) => signal.id === "monthly-limit"));
});

test("calculateResponsibleHealth prioritizes active pause", () => {
  const health = calculateResponsibleHealth({
    ...baseInput,
    pauseActive: true,
  });

  assert.equal(health.status, "pause-active");
  assert.ok(health.signals.some((signal) => signal.id === "pause-active"));
});

test("calculateResponsibleHealth flags loss streak and concentrated exposure", () => {
  const health = calculateResponsibleHealth({
    ...baseInput,
    currentLosingStreak: 4,
    sportExposure: [{ name: "Fútbol", exposurePct: 70 }],
    highSeverityAlertCount: 1,
    unreadAlertCount: 1,
  });

  assert.equal(health.status, "review-required");
  assert.ok(health.score < 65);
  assert.ok(health.signals.some((signal) => signal.id === "loss-streak"));
  assert.ok(health.signals.some((signal) => signal.id === "sport-concentration"));
  assert.ok(health.signals.some((signal) => signal.id === "high-alerts"));
});
