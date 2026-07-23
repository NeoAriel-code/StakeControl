import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const homePath = new URL("../src/app/page.tsx", import.meta.url);
const termsPath = new URL("../src/app/terms/page.tsx", import.meta.url);
const privacyPath = new URL("../src/app/privacy/page.tsx", import.meta.url);

test("public pages expose official contact addresses as mail links", async () => {
  const [home, terms, privacy] = await Promise.all([
    readFile(homePath, "utf8"),
    readFile(termsPath, "utf8"),
    readFile(privacyPath, "utf8"),
  ]);

  assert.match(home, /href="mailto:support@getstakecontrol\.com"/);
  assert.match(home, /href="mailto:contact@getstakecontrol\.com"/);
  assert.match(home, /href="mailto:privacy@getstakecontrol\.com"/);
  assert.match(terms, /href="mailto:contact@getstakecontrol\.com"/);
  assert.match(terms, /href="mailto:privacy@getstakecontrol\.com"/);
  assert.match(privacy, /href="mailto:privacy@getstakecontrol\.com"/);
});
