import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sourceFiles = [
  "src/lib/email/email-config.ts",
  "src/lib/email/email-delivery.ts",
  "src/lib/email/email-service.ts",
  "src/lib/email/email-templates.ts",
  "src/lib/email-verification-actions.ts",
  "src/lib/password-recovery-actions.ts",
];

test("transactional email source and templates never reference a Vercel production host", async () => {
  const source = await Promise.all(sourceFiles.map((file) => readFile(new URL(`../${file}`, import.meta.url), "utf8")));
  assert.doesNotMatch(source.join("\n"), /stakecontrol\.vercel\.app|https:\/\/[^\s"']*vercel\.app/i);
});

test("Resend credentials remain server-only and production startup validates email configuration", async () => {
  const source = await Promise.all([
    readFile(new URL("../src/lib/email/email-config.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/instrumentation.ts", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(source.join("\n"), /NEXT_PUBLIC_RESEND_API_KEY/);
  assert.match(source[1]!, /assertProductionEmailConfiguration/);
});
