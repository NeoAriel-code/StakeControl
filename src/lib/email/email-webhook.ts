import { createHash } from "node:crypto";

export type VerifiedEmailWebhookEvent = {
  id: string;
  type: string;
  created_at: string;
  data: { email_id?: string; to?: string[] };
};

type Delivery = { id: string; userId: string; kind: string };

export type EmailWebhookRepository = {
  recordEvent(input: { providerEventId: string; eventType: string; providerMessageId?: string }): Promise<boolean>;
  findDelivery(providerMessageId: string): Promise<Delivery | null>;
  updateDelivery(id: string, data: { lastEvent: string; occurredAt: Date }): Promise<void>;
  restrictEmail(input: { emailHash: string; reason: "BOUNCED" | "COMPLAINED" }): Promise<void>;
  createSecurityAlert(input: { userId: string; deliveryId: string; kind: string; occurredAt: Date }): Promise<void>;
};

const SECURITY_DELIVERY_KINDS = new Set(["EMAIL_VERIFICATION", "PASSWORD_RESET", "PASSWORD_CHANGED"]);
const RESTRICTION_REASONS = { "email.bounced": "BOUNCED", "email.complained": "COMPLAINED" } as const;

export function hashEmailAddress(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export function isSecurityEmailKind(kind: string) {
  return SECURITY_DELIVERY_KINDS.has(kind);
}

export async function processEmailWebhookEvent(event: VerifiedEmailWebhookEvent, repository: EmailWebhookRepository) {
  const providerMessageId = event.data.email_id;
  const recorded = await repository.recordEvent({ providerEventId: event.id, eventType: event.type, ...(providerMessageId ? { providerMessageId } : {}) });
  if (!recorded) return "duplicate" as const;
  if (!providerMessageId) return "processed" as const;

  const delivery = await repository.findDelivery(providerMessageId);
  if (!delivery) return "processed" as const;

  const occurredAt = new Date(event.created_at);
  await repository.updateDelivery(delivery.id, { lastEvent: event.type, occurredAt });

  const reason = RESTRICTION_REASONS[event.type as keyof typeof RESTRICTION_REASONS];
  const recipient = event.data.to?.[0];
  if (reason && recipient) await repository.restrictEmail({ emailHash: hashEmailAddress(recipient), reason });

  if (event.type !== "email.delivered" && isSecurityEmailKind(delivery.kind)) {
    await repository.createSecurityAlert({ userId: delivery.userId, deliveryId: delivery.id, kind: event.type, occurredAt });
  }

  return "processed" as const;
}
