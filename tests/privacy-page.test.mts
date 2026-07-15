import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const privacyPagePath = new URL("../src/app/privacy/page.tsx", import.meta.url);

test("privacy page states the agreed data practices and contact channel", async () => {
  const source = await readFile(privacyPagePath, "utf8");
  const renderedText = source.replace(/\s+/g, " ");

  for (const expectedCopy of [
    "privacy@getstakecontrol.com",
    "StakeControl no vende datos personales.",
    "Vercel",
    "Turso/libSQL",
    "Supabase Storage",
    "Google Cloud Vision",
    "OpenAI",
    "hasta 30 días",
    "no toma decisiones automáticas",
    "mayores de edad",
  ]) {
    assert.ok(renderedText.includes(expectedCopy), `Expected privacy policy to include: ${expectedCopy}`);
  }
});
