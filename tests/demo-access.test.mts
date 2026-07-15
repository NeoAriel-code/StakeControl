import assert from "node:assert/strict";
import test from "node:test";
import { canUseDemoData, parseDemoDataEmails } from "../src/lib/demo-access";

test("parses the approved demo accounts", () => {
  assert.deepEqual(
    [...parseDemoDataEmails(" arielalfaro.94@gmail.com, qa@getstakecontrol.com ")],
    ["arielalfaro.94@gmail.com", "qa@getstakecontrol.com"]
  );
});

test("only approves configured demo accounts", () => {
  const allowed = "arielalfaro.94@gmail.com,qa@getstakecontrol.com";

  assert.equal(canUseDemoData("ARIELALFARO.94@gmail.com", allowed), true);
  assert.equal(canUseDemoData("qa@getstakecontrol.com", allowed), true);
  assert.equal(canUseDemoData("member@example.com", allowed), false);
});
