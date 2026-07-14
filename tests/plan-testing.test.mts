import test from "node:test";
import assert from "node:assert/strict";
import { canUsePlanTestControls, parsePlanTesterEmails } from "../src/lib/plan-testing";

test("parses a normalized list of plan tester emails", () => {
  assert.deepEqual(
    [...parsePlanTesterEmails(" Ariel@Example.com, test@example.com , ")],
    ["ariel@example.com", "test@example.com"]
  );
});

test("only allows plan testing for configured emails", () => {
  const allowedEmails = "ariel@example.com";

  assert.equal(canUsePlanTestControls("ARIEL@example.com", allowedEmails), true);
  assert.equal(canUsePlanTestControls("other@example.com", allowedEmails), false);
});
