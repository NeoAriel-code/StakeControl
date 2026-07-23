import assert from "node:assert/strict";
import test from "node:test";
import { hashEmailAddress, processEmailWebhookEvent, type EmailWebhookRepository } from "../src/lib/email/email-webhook";

test("a bounced security delivery restricts only the recipient hash and creates one alert", async () => {
  const restricted: Array<{ emailHash: string; reason: string }> = [];
  const alerts: unknown[] = [];
  const repository: EmailWebhookRepository = {
    async recordEvent() { return true; },
    async findDelivery() { return { id: "delivery-1", userId: "user-1", kind: "PASSWORD_RESET" }; },
    async updateDelivery() {},
    async restrictEmail(input) { restricted.push(input); },
    async createSecurityAlert(input) { alerts.push(input); },
  };

  const result = await processEmailWebhookEvent({ id: "evt-1", type: "email.bounced", created_at: "2026-07-23T12:00:00.000Z", data: { email_id: "message-1", to: ["Person@example.com"] } }, repository);

  assert.equal(result, "processed");
  assert.deepEqual(restricted, [{ emailHash: hashEmailAddress("person@example.com"), reason: "BOUNCED" }]);
  assert.equal(alerts.length, 1);
});

test("a duplicate webhook event is ignored", async () => {
  const repository: EmailWebhookRepository = {
    async recordEvent() { return false; },
    async findDelivery() { throw new Error("not expected"); },
    async updateDelivery() { throw new Error("not expected"); },
    async restrictEmail() { throw new Error("not expected"); },
    async createSecurityAlert() { throw new Error("not expected"); },
  };

  assert.equal(await processEmailWebhookEvent({ id: "evt-1", type: "email.delivered", created_at: "2026-07-23T12:00:00.000Z", data: { email_id: "message-1", to: ["person@example.com"] } }, repository), "duplicate");
});

test("sent events update the delivery without creating a security alert", async () => {
  const updates: Array<{ lastEvent: string }> = [];
  const repository: EmailWebhookRepository = {
    async recordEvent() { return true; },
    async findDelivery() { return { id: "delivery-1", userId: "user-1", kind: "PASSWORD_RESET" }; },
    async updateDelivery(_id, input) { updates.push(input); },
    async restrictEmail() { throw new Error("not expected"); },
    async createSecurityAlert() { throw new Error("not expected"); },
  };

  assert.equal(await processEmailWebhookEvent({ id: "evt-sent", type: "email.sent", created_at: "2026-07-23T12:00:00.000Z", data: { email_id: "message-1" } }, repository), "processed");
  assert.deepEqual(updates, [{ lastEvent: "email.sent", occurredAt: new Date("2026-07-23T12:00:00.000Z") }]);
});

test("a complaint suppresses the hashed recipient and creates a security alert", async () => {
  const restricted: Array<{ emailHash: string; reason: string }> = [];
  const alerts: unknown[] = [];
  const repository: EmailWebhookRepository = {
    async recordEvent() { return true; },
    async findDelivery() { return { id: "delivery-1", userId: "user-1", kind: "EMAIL_VERIFICATION" }; },
    async updateDelivery() {},
    async restrictEmail(input) { restricted.push(input); },
    async createSecurityAlert(input) { alerts.push(input); },
  };

  await processEmailWebhookEvent({ id: "evt-complaint", type: "email.complained", created_at: "2026-07-23T12:00:00.000Z", data: { email_id: "message-1", to: ["person@example.com"] } }, repository);
  assert.deepEqual(restricted, [{ emailHash: hashEmailAddress("person@example.com"), reason: "COMPLAINED" }]);
  assert.equal(alerts.length, 1);
});
