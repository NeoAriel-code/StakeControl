import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { canRemoveAdministrator } from "../src/lib/admin-rules";
import { hmacRateLimitKey, resolveTrustedClientIp } from "../src/lib/rate-limit-identifiers";
import { isPauseActiveAt } from "../src/lib/responsible-gaming-rules";
import { isSessionVersionCurrent } from "../src/lib/session-security";

test("an indefinite administrative suspension blocks even without pauseUntil", () => {
  assert.equal(isPauseActiveAt(null, new Date("2026-08-04T12:00:00Z"), true), true);
  assert.equal(isPauseActiveAt(null, new Date("2026-08-04T12:00:00Z"), false), false);
});

test("a password version bump revokes old sessions while allowing the renewed session", () => {
  assert.equal(isSessionVersionCurrent(3, 4), false);
  assert.equal(isSessionVersionCurrent(4, 4), true);
});

test("the last administrator cannot be demoted or self-delete", () => {
  assert.equal(canRemoveAdministrator(true, 1), false);
  assert.equal(canRemoveAdministrator(true, 2), true);
  assert.equal(canRemoveAdministrator(false, 1), true);
});

test("rate-limit persistence uses an opaque stable HMAC instead of the account identifier", () => {
  const first = hmacRateLimitKey("registration:user@example.com", "test-secret");
  assert.equal(first, hmacRateLimitKey("registration:user@example.com", "test-secret"));
  assert.equal(first.includes("user@example.com"), false);
  assert.match(first, /^[a-f0-9]{64}$/);
});

test("client IP resolution trusts only platform headers enabled by configuration", () => {
  const headers = new Headers({ "x-forwarded-for": "198.51.100.1", "cf-connecting-ip": "203.0.113.2", "x-real-ip": "192.0.2.3" });
  assert.equal(resolveTrustedClientIp(headers, {}), "192.0.2.3");
  assert.equal(resolveTrustedClientIp(headers, { TRUST_CLOUDFLARE_PROXY: "true" }), "203.0.113.2");
  assert.equal(resolveTrustedClientIp(headers, { VERCEL: "1" }), "198.51.100.1");
});

test("admin content routes create audit records before returning sensitive detail", async () => {
  const ticketRoute = await readFile(new URL("../src/app/api/admin/users/[userId]/tickets/[ticketId]/route.ts", import.meta.url), "utf8");
  const betRoute = await readFile(new URL("../src/app/api/admin/users/[userId]/bets/[betId]/route.ts", import.meta.url), "utf8");
  assert.match(ticketRoute, /recordAdminContentAccess/);
  assert.match(ticketRoute, /resource:\s*"ticket"/);
  assert.match(betRoute, /recordAdminContentAccess/);
  assert.match(betRoute, /resource:\s*"bet"/);
});

test("health check exposes only the documented status and disables caching", async () => {
  const route = await readFile(new URL("../src/app/api/health/route.ts", import.meta.url), "utf8");
  assert.match(route, /status:\s*"ok"/);
  assert.match(route, /status:\s*"unavailable"/);
  assert.match(route, /Cache-Control.*no-store/);
  assert.match(route, /HEALTH_TIMEOUT_MS\s*=\s*2_000/);
});

test("registration has an operational switch and does not disclose existing accounts", async () => {
  const actions = await readFile(new URL("../src/lib/auth-actions.ts", import.meta.url), "utf8");
  assert.match(actions, /REGISTRATION_ENABLED/);
  assert.doesNotMatch(actions, /Ese email ya está registrado/);
  assert.match(actions, /checkPublicRateLimit/);
});
