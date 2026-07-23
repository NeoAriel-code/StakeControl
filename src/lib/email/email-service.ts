import "server-only";

import { EmailDeliveryKind, EmailDeliveryStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getEmailConfiguration } from "@/lib/email/email-config";
import { EmailDeliveryService } from "@/lib/email/email-delivery";
import { type EmailWebhookRepository } from "@/lib/email/email-webhook";
import { ResendEmailProvider } from "@/lib/email/resend-provider";
import { reportOperationalError } from "@/lib/observability/sentry";

function withDisplayName(configuredFrom: string, displayName?: string) {
  if (!displayName) return configuredFrom;
  const address = configuredFrom.match(/<([^>]+)>/)?.[1] ?? configuredFrom;
  return `${displayName} <${address}>`;
}

export function getEmailDeliveryService() {
  const config = getEmailConfiguration();
  if (!config) return null;
  const resend = new ResendEmailProvider(config.apiKey);

  return new EmailDeliveryService({
    client: {
      async send(input) {
        return resend.send({
          from: withDisplayName(
            input.sender === "security" ? config.securityFrom : input.sender === "alerts" ? config.alertsFrom : input.sender === "reports" ? config.reportsFrom : config.from,
            input.fromName,
          ),
          to: input.to,
          subject: input.subject,
          html: input.html,
          text: input.text,
          ...(config.replyTo ? { replyTo: config.replyTo } : {}),
          idempotencyKey: input.idempotencyKey,
        });
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
          console.error("Failed to create email delivery ledger record.", { kind: input.kind });
          return null;
        }
      },
      async markSent(id, update) { if (!id.startsWith("untracked-")) await prisma.emailDelivery.update({ where: { id }, data: { status: update.status as EmailDeliveryStatus, providerMessageId: update.providerMessageId, sentAt: new Date() } }); },
      async markFailed(id, update) { if (!id.startsWith("untracked-")) await prisma.emailDelivery.update({ where: { id }, data: { status: update.status as EmailDeliveryStatus, failureReason: update.failureReason } }); },
      async isRestricted(emailHash) { return Boolean(await prisma.restrictedEmailAddress.findUnique({ where: { emailHash }, select: { id: true } })); },
    },
    onOperationalError: reportOperationalError,
  });
}

export const emailWebhookRepository: EmailWebhookRepository = {
  async recordEvent(input) {
    try { await prisma.emailWebhookEvent.create({ data: input }); return true; } catch { return false; }
  },
  async findDelivery(providerMessageId) { return prisma.emailDelivery.findUnique({ where: { providerMessageId }, select: { id: true, userId: true, kind: true } }); },
  async updateDelivery(id, { lastEvent, occurredAt }) {
    const timestampField = ({ "email.sent": "sentAt", "email.delivered": "deliveredAt", "email.bounced": "bouncedAt", "email.complained": "complainedAt", "email.failed": "failedAt", "email.delivery_delayed": "delayedAt" } as const)[lastEvent];
    await prisma.emailDelivery.update({ where: { id }, data: { lastEvent, ...(timestampField ? { [timestampField]: occurredAt } : {}) } });
  },
  async restrictEmail(input) { await prisma.restrictedEmailAddress.upsert({ where: { emailHash: input.emailHash }, create: input, update: { reason: input.reason } }); },
  async createSecurityAlert(input) { await prisma.accountSecurityAlert.upsert({ where: { deliveryId: input.deliveryId }, create: input, update: {} }); },
};
