import test from "node:test";
import assert from "node:assert/strict";
import { decimalToAmericanOdds, formatOdds } from "../src/lib/odds-format";

test("formatOdds keeps decimal odds with two decimals", () => {
  assert.equal(formatOdds(1.85, "DECIMAL"), "1.85");
  assert.equal(formatOdds(2, "DECIMAL"), "2.00");
});

test("decimalToAmericanOdds converts favorites and underdogs", () => {
  assert.equal(decimalToAmericanOdds(1.5), "-200");
  assert.equal(decimalToAmericanOdds(2.5), "+150");
});

test("formatOdds handles invalid odds defensively", () => {
  assert.equal(formatOdds(1, "AMERICAN"), "—");
});
