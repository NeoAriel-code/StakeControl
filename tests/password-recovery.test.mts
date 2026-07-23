import assert from "node:assert/strict";
import test from "node:test";
import { hashPasswordResetToken, isPasswordResetTokenUsable } from "../src/lib/password-recovery";
import { isPasswordRecoveryEmailConfigured } from "../src/lib/password-recovery-email";
import { readFile } from "node:fs/promises";

test("hashes reset tokens without retaining their plaintext value", () => {
  assert.equal(hashPasswordResetToken("secret-token"), hashPasswordResetToken("secret-token"));
  assert.notEqual(hashPasswordResetToken("secret-token"), "secret-token");
});

test("accepts only unused, unexpired reset tokens", () => {
  const now = new Date("2026-07-15T12:00:00.000Z");

  assert.equal(isPasswordResetTokenUsable({ expiresAt: new Date("2026-07-15T12:30:00.000Z"), usedAt: null }, now), true);
  assert.equal(isPasswordResetTokenUsable({ expiresAt: new Date("2026-07-15T11:30:00.000Z"), usedAt: null }, now), false);
  assert.equal(isPasswordResetTokenUsable({ expiresAt: new Date("2026-07-15T12:30:00.000Z"), usedAt: now }, now), false);
});

test("does not enable recovery delivery without a configured email provider", () => {
  assert.equal(isPasswordRecoveryEmailConfigured({ EMAIL_PROVIDER: "resend", RESEND_API_KEY: "" }), false);
  assert.equal(isPasswordRecoveryEmailConfigured({ EMAIL_PROVIDER: "mock", RESEND_API_KEY: "key" }), false);
});

test("password recovery is limited to three requests per email each hour", async () => {
  const action = await readFile(new URL("../src/lib/password-recovery-actions.ts", import.meta.url), "utf8");

  assert.match(action, /key:\s*`password-reset:/);
  assert.match(action, /limit:\s*3/);
  assert.match(action, /windowMs:\s*60 \* 60 \* 1000/);
});
