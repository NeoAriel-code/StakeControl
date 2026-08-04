import assert from "node:assert/strict";
import test from "node:test";
import {
  canReserveAiProbe,
  getAiCircuitOpenUntil,
  isAiCircuitStillOpen,
  shouldCloseAiCircuit,
  shouldOpenAiCircuit,
} from "../src/lib/ai/ai-circuit";

test("AI circuit opens at 20 transient failures for two minutes", () => {
  const now = new Date("2026-08-03T12:00:00.000Z");
  assert.equal(shouldOpenAiCircuit(19), false);
  assert.equal(shouldOpenAiCircuit(20), true);
  const openUntil = getAiCircuitOpenUntil(now);
  assert.equal(openUntil.toISOString(), "2026-08-03T12:02:00.000Z");
  assert.equal(isAiCircuitStillOpen(openUntil, new Date("2026-08-03T12:01:59.999Z")), true);
  assert.equal(isAiCircuitStillOpen(openUntil, openUntil), false);
});

test("AI half-open circuit admits and requires exactly five successful probes", () => {
  assert.equal(canReserveAiProbe(4), true);
  assert.equal(canReserveAiProbe(5), false);
  assert.equal(shouldCloseAiCircuit(4), false);
  assert.equal(shouldCloseAiCircuit(5), true);
});
