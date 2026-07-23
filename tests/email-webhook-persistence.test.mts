import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("email delivery persistence supports webhook events without plaintext recipients", async () => {
  const schema = await readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8");

  assert.match(schema, /model EmailWebhookEvent/);
  assert.match(schema, /model RestrictedEmailAddress/);
  assert.match(schema, /model AccountSecurityAlert/);
  assert.match(schema, /recipientHash\s+String\?/);
  assert.match(schema, /providerMessageId\s+String\?\s+@unique/);
});
