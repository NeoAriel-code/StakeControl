import test from "node:test";
import assert from "node:assert/strict";
import { getHistoricalProfitLoss, getQuickResultFinancials } from "../src/lib/bet-outcomes";

test("getHistoricalProfitLoss derives a full loss from the stake", () => {
  assert.equal(getHistoricalProfitLoss("LOST", 121286.7, 1212867), -121286.7);
  assert.equal(getHistoricalProfitLoss("PENDING", 121286.7, 1212867), 0);
});

test("getQuickResultFinancials recalculates a loss and a win", () => {
  assert.deepEqual(
    getQuickResultFinancials({ result: "LOST", stake: 100, odds: 2, potentialPayout: 200, settledPayout: null }),
    { profitLoss: -100, settledPayout: null }
  );
  assert.deepEqual(
    getQuickResultFinancials({ result: "WON", stake: 100, odds: 2, potentialPayout: 210, settledPayout: null }),
    { profitLoss: 110, settledPayout: 210 }
  );
});

test("getQuickResultFinancials handles every remaining result safely", () => {
  const base = { stake: 100, odds: 2, potentialPayout: 200, settledPayout: null };

  assert.deepEqual(getQuickResultFinancials({ ...base, result: "PENDING" }), { profitLoss: 0, settledPayout: null });
  assert.deepEqual(getQuickResultFinancials({ ...base, result: "UNKNOWN" }), { profitLoss: 0, settledPayout: null });
  assert.deepEqual(getQuickResultFinancials({ ...base, result: "VOID" }), { profitLoss: 0, settledPayout: 100 });
  assert.deepEqual(getQuickResultFinancials({ ...base, result: "CASHOUT" }), { profitLoss: 0, settledPayout: null });
});
