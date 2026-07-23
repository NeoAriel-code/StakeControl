import assert from "node:assert/strict";
import test from "node:test";
import { EmailDeliveryService, type EmailDeliveryRepository } from "../src/lib/email/email-delivery";

test("a failed provider delivery is recorded without rejecting", async () => {
  const updates: Array<{ status: string; failureReason?: string }> = [];
  const repository: EmailDeliveryRepository = {
    async createPending() { return { id: "delivery-1" }; },
    async markSent() { throw new Error("not expected"); },
    async markFailed(_id, update) { updates.push(update); },
  };
  const service = new EmailDeliveryService({
    client: { send: async () => { throw new Error("provider unavailable"); } },
    repository,
  });

  const result = await service.sendWelcome({ userId: "user-1", email: "person@example.com" });

  assert.equal(result.delivered, false);
  assert.equal(updates[0]?.status, "FAILED");
  assert.match(updates[0]?.failureReason ?? "", /provider unavailable/);
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
