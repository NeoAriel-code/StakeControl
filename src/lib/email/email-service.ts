import "server-only";

import { Resend } from "resend";
import { EmailDeliveryKind, EmailDeliveryStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getEmailConfiguration } from "@/lib/email/email-config";
import { EmailDeliveryService } from "@/lib/email/email-delivery";
import { type EmailWebhookRepository } from "@/lib/email/email-webhook";

function withDisplayName(configuredFrom: string, displayName?: string) {
  if (!displayName) return configuredFrom;
  const address = configuredFrom.match(/<([^>]+)>/)?.[1] ?? configuredFrom;
  return `${displayName} <${address}>`;
}

export function getEmailDeliveryService() {
  const config = getEmailConfiguration();
  if (!config) return null;
  const resend = new Resend(config.apiKey);

  return new EmailDeliveryService({
    client: {
      async send(input) {
        const { data, error } = await resend.emails.send({ from: withDisplayName(config.from, input.fromName), to: [input.to], subject: input.subject, html: input.html, text: input.text, ...(config.replyTo ? { replyTo: config.replyTo } : {}) });
        if (error || !data?.id) throw new Error(error?.message || "Resend no devolvió un identificador de entrega.");
        return { id: data.id };
      },
    },
    repository: {
      async createPending(input) {
        try {
          return await prisma.emailDelivery.create({ data: { ...input, kind: input.kind as EmailDeliveryKind, status: EmailDeliveryStatus.PENDING } });
        } catch (error) {
          if (error instanceof Error && /no such table: main\.EmailDelivery/i.test(error.message)) {
            return { id: `untracked-${input.dedupeKey}` };
          }
          return null;
        }
      },
      async markSent(id, update) { if (!id.startsWith("untracked-")) await prisma.emailDelivery.update({ where: { id }, data: { status: update.status as EmailDeliveryStatus, providerMessageId: update.providerMessageId, sentAt: new Date() } }); },
      async markFailed(id, update) { if (!id.startsWith("untracked-")) await prisma.emailDelivery.update({ where: { id }, data: { status: update.status as EmailDeliveryStatus, failureReason: update.failureReason } }); },
      async isRestricted(emailHash) { return Boolean(await prisma.restrictedEmailAddress.findUnique({ where: { emailHash }, select: { id: true } })); },
    },
  });
}

export const emailWebhookRepository: EmailWebhookRepository = {
  async recordEvent(input) {
    try { await prisma.emailWebhookEvent.create({ data: input }); return true; } catch { return false; }
  },
  async findDelivery(providerMessageId) { return prisma.emailDelivery.findUnique({ where: { providerMessageId }, select: { id: true, userId: true, kind: true } }); },
  async updateDelivery(id, { lastEvent, occurredAt }) {
    const timestampField = ({ "email.delivered": "deliveredAt", "email.bounced": "bouncedAt", "email.complained": "complainedAt", "email.failed": "failedAt", "email.delivery_delayed": "delayedAt" } as const)[lastEvent];
    await prisma.emailDelivery.update({ where: { id }, data: { lastEvent, ...(timestampField ? { [timestampField]: occurredAt } : {}) } });
  },
  async restrictEmail(input) { await prisma.restrictedEmailAddress.upsert({ where: { emailHash: input.emailHash }, create: input, update: { reason: input.reason } }); },
  async createSecurityAlert(input) { await prisma.accountSecurityAlert.upsert({ where: { deliveryId: input.deliveryId }, create: input, update: {} }); },
};
