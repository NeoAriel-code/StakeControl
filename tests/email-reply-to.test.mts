import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const emailServicePath = new URL("../src/lib/email/email-service.ts", import.meta.url);

test("Resend delivery forwards the configured Reply-To address", async () => {
  const source = await readFile(emailServicePath, "utf8");

  assert.match(source, /\.\.\.\(config\.replyTo \? \{ replyTo: config\.replyTo \} : \{\}\)/);
});
