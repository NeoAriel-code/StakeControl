import "server-only";

import { Resend } from "resend";
import { EmailDeliveryKind, EmailDeliveryStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getEmailConfiguration } from "@/lib/email/email-config";
import { EmailDeliveryService } from "@/lib/email/email-delivery";

export function getEmailDeliveryService() {
  const config = getEmailConfiguration();
  if (!config) return null;
  const resend = new Resend(config.apiKey);

  return new EmailDeliveryService({
    client: {
      async send(input) {
        const { data, error } = await resend.emails.send({ from: config.from, to: [input.to], subject: input.subject, html: input.html, text: input.text });
        if (error || !data?.id) throw new Error(error?.message || "Resend no devolvió un identificador de entrega.");
        return { id: data.id };
      },
    },
    repository: {
      async createPending(input) {
        try {
          return await prisma.emailDelivery.create({ data: { ...input, kind: input.kind as EmailDeliveryKind, status: EmailDeliveryStatus.PENDING } });
        } catch {
          return null;
        }
      },
      async markSent(id, update) { await prisma.emailDelivery.update({ where: { id }, data: { status: update.status as EmailDeliveryStatus, providerMessageId: update.providerMessageId, sentAt: new Date() } }); },
      async markFailed(id, update) { await prisma.emailDelivery.update({ where: { id }, data: { status: update.status as EmailDeliveryStatus, failureReason: update.failureReason } }); },
    },
  });
}
