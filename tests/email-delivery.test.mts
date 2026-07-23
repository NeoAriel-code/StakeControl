import assert from "node:assert/strict";
import test from "node:test";
import { EmailDeliveryService, type EmailDeliveryRepository } from "../src/lib/email/email-delivery";

test("a failed provider delivery is recorded without rejecting", async () => {
  const updates: Array<{ status: string; failureReason?: string }> = [];
  const reported: Array<{ category: string; userId?: string }> = [];
  const repository: EmailDeliveryRepository = {
    async createPending() { return { id: "delivery-1" }; },
    async markSent() { throw new Error("not expected"); },
    async markFailed(_id, update) { updates.push(update); },
  };
  const service = new EmailDeliveryService({
    client: { send: async () => { throw new Error("provider unavailable"); } },
    repository,
    onOperationalError(category, userId) { reported.push({ category, userId }); },
  });

  const result = await service.sendWelcome({ userId: "user-1", email: "person@example.com" });

  assert.equal(result.delivered, false);
  assert.equal(updates[0]?.status, "FAILED");
  assert.equal(updates[0]?.failureReason, "provider_send_failed");
  assert.deepEqual(reported, [{ category: "email.delivery_failed", userId: "user-1" }]);
});

test("a duplicate delivery key is skipped before calling the provider", async () => {
  const repository: EmailDeliveryRepository = {
    async createPending() { return null; },
    async markSent() { throw new Error("not expected"); },
    async markFailed() { throw new Error("not expected"); },
  };
  let sent = false;
  const service = new EmailDeliveryService({ client: { send: async () => { sent = true; return { id: "email-1" }; } }, repository });

  const result = await service.sendWelcome({ userId: "user-1", email: "person@example.com" });

  assert.deepEqual(result, { delivered: false });
  assert.equal(sent, false);
});

test("welcome emails use the StakeControl brand layout and a clear CTA", async () => {
  let sent: { html: string; text: string } | undefined;
  const repository: EmailDeliveryRepository = { async createPending() { return { id: "delivery-1" }; }, async markSent() {}, async markFailed() {} };
  const service = new EmailDeliveryService({ client: { send: async (input) => { sent = input; return { id: "email-1" }; } }, repository });

  await service.sendWelcome({ userId: "user-1", email: "person@example.com" });

  assert.match(sent?.html ?? "", /StakeControl/);
  assert.match(sent?.html ?? "", /#0B252B/);
  assert.match(sent?.html ?? "", /Ir a StakeControl/);
  assert.match(sent?.text ?? "", /Tu cuenta de StakeControl está lista/);
});

test("a delivery ledger outage does not prevent an already accepted email", async () => {
  const repository: EmailDeliveryRepository = {
    async createPending() { return { id: "untracked-1" }; },
    async markSent() { throw new Error("no such table: EmailDelivery"); },
    async markFailed() { throw new Error("not expected"); },
  };
  const service = new EmailDeliveryService({ client: { send: async () => ({ id: "email-1" }) }, repository });

  const result = await service.sendWelcome({ userId: "user-1", email: "person@example.com" });

  assert.equal(result.delivered, true);
});

test("verification emails use a security sender and include a 24-hour confirmation CTA", async () => {
  let sent: { subject: string; fromName?: string; html: string; text: string } | undefined;
  const repository: EmailDeliveryRepository = { async createPending() { return { id: "delivery-1" }; }, async markSent() {}, async markFailed() {} };
  const service = new EmailDeliveryService({ client: { send: async (input) => { sent = input; return { id: "email-1" }; } }, repository });

  await service.sendEmailVerification({
    userId: "user-1",
    email: "person@example.com",
    verificationUrl: "https://app.getstakecontrol.com/verify-email?token=token-1",
    token: "token-1",
  });

  assert.equal(sent?.subject, "Confirma tu correo de StakeControl");
  assert.equal(sent?.fromName, "StakeControl Seguridad");
  assert.match(sent?.html ?? "", /Confirmar correo/);
  assert.match(sent?.text ?? "", /24 horas/);
});

test("password change notices use the security sender and direct replies to support", async () => {
  let sent: { subject: string; fromName?: string; text: string } | undefined;
  const repository: EmailDeliveryRepository = { async createPending() { return { id: "delivery-1" }; }, async markSent() {}, async markFailed() {} };
  const service = new EmailDeliveryService({ client: { send: async (input) => { sent = input; return { id: "email-1" }; } }, repository });

  await service.sendPasswordChanged({ userId: "user-1", email: "person@example.com", changedAt: new Date("2026-07-23T12:00:00.000Z") });

  assert.equal(sent?.subject, "Tu contraseña de StakeControl fue modificada");
  assert.equal(sent?.fromName, "StakeControl Seguridad");
  assert.match(sent?.text ?? "", /support@getstakecontrol.com/);
});

test("restricted recipients skip non-security deliveries but still receive password resets", async () => {
  const sent: string[] = [];
  const repository: EmailDeliveryRepository = {
    async createPending() { return { id: "delivery-1" }; },
    async markSent() {},
    async markFailed() {},
    async isRestricted() { return true; },
  };
  const service = new EmailDeliveryService({ client: { send: async (input) => { sent.push(input.subject); return { id: "email-1" }; } }, repository });

  const welcome = await service.sendWelcome({ userId: "user-1", email: "person@example.com" });
  const reset = await service.sendPasswordReset({ userId: "user-1", email: "person@example.com", token: "token-1", resetUrl: "https://example.com/reset" });

  assert.equal(welcome.delivered, false);
  assert.equal(reset.delivered, true);
  assert.deepEqual(sent, ["Restablece tu contraseña de StakeControl"]);
});

test("delivery persistence receives a recipient hash without a plaintext email field", async () => {
  let pendingInput: Record<string, unknown> | undefined;
  const repository: EmailDeliveryRepository = {
    async createPending(input) { pendingInput = input; return { id: "delivery-1" }; },
    async markSent() {},
    async markFailed() {},
  };
  const service = new EmailDeliveryService({ client: { send: async () => ({ id: "email-1" }) }, repository });

  await service.sendPasswordReset({ userId: "user-1", email: "person@example.com", token: "token-1", resetUrl: "https://example.com/reset" });

  assert.equal("email" in (pendingInput ?? {}), false);
  assert.equal(typeof pendingInput?.recipientHash, "string");
});

test("email change and account deletion notices are security messages with distinct idempotency keys", async () => {
  const sent: Array<{ subject: string; idempotencyKey: string; fromName?: string }> = [];
  const repository: EmailDeliveryRepository = {
    async createPending() { return { id: "delivery-1" }; },
    async markSent() {},
    async markFailed() {},
    async isRestricted() { return true; },
  };
  const service = new EmailDeliveryService({
    client: { send: async (input) => { sent.push(input); return { id: `email-${sent.length}` }; } },
    repository,
  });

  await service.sendEmailChanged({ userId: "user-1", email: "person@example.com", previousEmail: "old@example.com", changedAt: new Date("2026-07-23T12:00:00.000Z") });
  await service.sendAccountDeleted({ userId: "user-1", email: "person@example.com", deletedAt: new Date("2026-07-23T12:01:00.000Z") });

  assert.deepEqual(sent.map(({ subject, idempotencyKey, fromName }) => ({ subject, idempotencyKey, fromName })), [
    { subject: "Tu correo de StakeControl fue modificado", idempotencyKey: "email-changed:user-1:2026-07-23T12:00:00.000Z", fromName: "StakeControl Seguridad" },
    { subject: "Tu cuenta de StakeControl fue eliminada", idempotencyKey: "account-deleted:user-1:2026-07-23T12:01:00.000Z", fromName: "StakeControl Seguridad" },
  ]);
});
