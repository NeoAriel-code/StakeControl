import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("privacy policy declares optional analytics and its exclusions", async () => {
  const source = await readFile(new URL("../src/app/privacy/page.tsx", import.meta.url), "utf8");

  assert.match(source, /PostHog/);
  assert.match(source, /consentimiento/);
  assert.match(source, /No enviamos apuestas, tickets,/);
  assert.match(source, /identificadores directos de cuenta/);
});
