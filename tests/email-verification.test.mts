import assert from "node:assert/strict";
import test from "node:test";
import { hashEmailVerificationToken, isEmailVerificationTokenUsable } from "../src/lib/email-verification";

test("verification tokens are hashed and usable only before expiry and consumption", () => {
  const now = new Date("2026-07-23T12:00:00.000Z");

  assert.notEqual(hashEmailVerificationToken("plain-token"), "plain-token");
  assert.equal(isEmailVerificationTokenUsable({ expiresAt: new Date("2026-07-24T12:00:00.000Z"), usedAt: null }, now), true);
  assert.equal(isEmailVerificationTokenUsable({ expiresAt: new Date("2026-07-23T11:00:00.000Z"), usedAt: null }, now), false);
  assert.equal(isEmailVerificationTokenUsable({ expiresAt: new Date("2026-07-24T12:00:00.000Z"), usedAt: now }, now), false);
});
