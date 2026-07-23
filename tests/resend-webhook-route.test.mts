import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Resend webhook route verifies the raw payload before processing", async () => {
  const route = await readFile(new URL("../src/app/api/webhooks/resend/route.ts", import.meta.url), "utf8");
  assert.match(route, /await request\.text\(\)/);
  assert.match(route, /resend\.webhooks\.verify/);
  assert.match(route, /RESEND_WEBHOOK_SECRET/);
});
