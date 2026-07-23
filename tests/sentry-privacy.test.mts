import assert from "node:assert/strict";
import test from "node:test";
import { scrubSentryEvent } from "../src/lib/observability/sentry-privacy";
import { anonymizeUserId } from "../src/lib/observability/sentry-user";

test("Sentry events retain only an anonymous internal user identifier and remove sensitive application data", () => {
  const anonymousId = anonymizeUserId("user-internal-1");
  const event = scrubSentryEvent({
    message: "person@example.com reset token=secret",
    user: { id: anonymousId, email: "person@example.com", ip_address: "127.0.0.1" },
    request: { data: { email: "person@example.com", ocrText: "raw ticket" }, headers: { authorization: "Bearer secret" } },
    extra: { bet: { ticketCode: "ABC-123", stake: 100 }, answer: "personal response" },
    contexts: { account: { email: "person@example.com", ticketCode: "ABC-123" } },
    attachments: [{ filename: "ticket.png" }],
    exception: { values: [{ type: "Error", value: "email person@example.com token secret" }] },
    tags: { category: "ocr.failed", email: "person@example.com" },
  });

  assert.deepEqual(event.user, { id: anonymousId });
  assert.equal(event.request, undefined);
  assert.equal(event.extra, undefined);
  assert.equal(event.contexts, undefined);
  assert.equal(event.attachments, undefined);
  assert.equal(event.message, undefined);
  assert.equal(event.exception?.values?.[0]?.value, "Operational error");
  assert.deepEqual(event.tags, { category: "ocr.failed" });
  assert.doesNotMatch(JSON.stringify(event), /person@example\.com|secret|raw ticket|ABC-123|personal response|127\.0\.0\.1/);
});
