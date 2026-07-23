import { createHash } from "node:crypto";
import { renderEmailTemplate } from "@/lib/email/email-templates";
import { isSecurityEmailKind } from "@/lib/email/email-webhook";

export type EmailClient = {
  send(input: { to: string; subject: string; html: string; text: string; fromName?: string; sender?: "default" | "security" | "alerts" | "reports"; idempotencyKey: string }): Promise<{ id: string }>;
};

export type EmailDeliveryRepository = {
  createPending(input: { userId: string; dedupeKey: string; kind: "WELCOME" | "EMAIL_VERIFICATION" | "PASSWORD_RESET" | "PASSWORD_CHANGED" | "EMAIL_CHANGED" | "ACCOUNT_DELETED" | "RESPONSIBLE_GAMING_ALERT"; recipientHash: string; alertId?: string }): Promise<{ id: string } | null>;
  markSent(id: string, update: { status: "SENT"; providerMessageId: string }): Promise<void>;
  markFailed(id: string, update: { status: "FAILED"; failureReason: string }): Promise<void>;
  isRestricted?(emailHash: string): Promise<boolean>;
};

type WelcomeInput = { userId: string; email: string };
type EmailVerificationInput = { userId: string; email: string; verificationUrl: string; token: string };
type PasswordResetInput = { userId: string; email: string; resetUrl: string; token: string };
type PasswordChangedInput = { userId: string; email: string; changedAt: Date };
type EmailChangedInput = { userId: string; email: string; previousEmail: string; changedAt: Date };
type AccountDeletedInput = { userId: string; email: string; deletedAt: Date };
type AlertInput = { userId: string; alertId: string; email: string; title: string; message: string; alertsUrl: string };

function deliveryFailureReason() {
  return "provider_send_failed";
}

async function markSentSafely(repository: EmailDeliveryRepository, id: string, providerMessageId: string) {
  try { await repository.markSent(id, { status: "SENT", providerMessageId }); } catch { /* delivery was accepted; ledger is best effort */ }
}

async function markFailedSafely(repository: EmailDeliveryRepository, id: string, failureReason: string) {
  try { await repository.markFailed(id, { status: "FAILED", failureReason }); } catch { /* provider failure must not break the caller */ }
}

function hashRecipient(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

async function createPendingDelivery(repository: EmailDeliveryRepository, input: { userId: string; email: string; dedupeKey: string; kind: "WELCOME" | "EMAIL_VERIFICATION" | "PASSWORD_RESET" | "PASSWORD_CHANGED" | "EMAIL_CHANGED" | "ACCOUNT_DELETED" | "RESPONSIBLE_GAMING_ALERT"; alertId?: string }) {
  const { email, ...deliveryInput } = input;
  const recipientHash = hashRecipient(email);
  if (!isSecurityEmailKind(input.kind) && await repository.isRestricted?.(recipientHash)) return null;
  return repository.createPending({ ...deliveryInput, recipientHash });
}

export class EmailDeliveryService {
  constructor(private readonly dependencies: {
    client: EmailClient;
    repository: EmailDeliveryRepository;
    onOperationalError?: (category: "email.delivery_failed", userId: string) => void;
  }) {}

  private reportDeliveryFailure(userId: string) {
    this.dependencies.onOperationalError?.("email.delivery_failed", userId);
  }

  async sendWelcome({ userId, email }: WelcomeInput) {
    const pending = await createPendingDelivery(this.dependencies.repository, { userId, email, dedupeKey: `welcome:${userId}`, kind: "WELCOME" });
    if (!pending) return { delivered: false };

    try {
      const template = renderEmailTemplate({ eyebrow: "Cuenta lista", title: "Bienvenido a StakeControl", bodyHtml: "<p>Hola,</p><p>Tu cuenta está lista. Puedes registrar tu actividad y configurar alertas preventivas cuando quieras.</p>", bodyText: "Hola. Tu cuenta de StakeControl está lista.", ctaLabel: "Ir a StakeControl", ctaUrl: "https://app.getstakecontrol.com/dashboard", footerNote: "Este es un correo transaccional de tu cuenta." });
      const response = await this.dependencies.client.send({
        to: email,
        subject: "Bienvenido a StakeControl",
        idempotencyKey: `welcome:${userId}`,
        ...template,
      });
      await markSentSafely(this.dependencies.repository, pending.id, response.id);
      return { delivered: true, deliveryId: pending.id };
    } catch (error) {
      console.error("Transactional email delivery failed.", { kind: "WELCOME" });
      this.reportDeliveryFailure(userId);
      await markFailedSafely(this.dependencies.repository, pending.id, deliveryFailureReason());
      return { delivered: false, deliveryId: pending.id };
    }
  }

  async sendPasswordReset({ userId, email, resetUrl, token }: PasswordResetInput) {
    const tokenHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    const dedupeKey = `password-reset:${Buffer.from(tokenHash).toString("hex")}`;
    const pending = await createPendingDelivery(this.dependencies.repository, { userId, email, dedupeKey, kind: "PASSWORD_RESET" });
    if (!pending) return { delivered: false };

    try {
      const template = renderEmailTemplate({ eyebrow: "Seguridad", title: "Restablece tu contraseña", bodyHtml: "<p>Recibimos una solicitud para restablecer tu contraseña.</p>", bodyText: "Recibimos una solicitud para restablecer tu contraseña.", ctaLabel: "Restablecer contraseña", ctaUrl: resetUrl, footerNote: "El enlace vence en una hora. Si no hiciste esta solicitud, ignora este correo." });
      const response = await this.dependencies.client.send({
        to: email,
        subject: "Restablece tu contraseña de StakeControl",
        fromName: "StakeControl Seguridad",
        sender: "security",
        idempotencyKey: dedupeKey,
        ...template,
      });
      await markSentSafely(this.dependencies.repository, pending.id, response.id);
      return { delivered: true, deliveryId: pending.id };
    } catch (error) {
      console.error("Transactional email delivery failed.", { kind: "PASSWORD_RESET" });
      this.reportDeliveryFailure(userId);
      await markFailedSafely(this.dependencies.repository, pending.id, deliveryFailureReason());
      return { delivered: false, deliveryId: pending.id };
    }
  }

  async sendEmailVerification({ userId, email, verificationUrl, token }: EmailVerificationInput) {
    const tokenHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    const dedupeKey = `email-verification:${Buffer.from(tokenHash).toString("hex")}`;
    const pending = await createPendingDelivery(this.dependencies.repository, { userId, email, dedupeKey, kind: "EMAIL_VERIFICATION" });
    if (!pending) return { delivered: false };

    try {
      const template = renderEmailTemplate({ eyebrow: "Verifica tu cuenta", title: "Confirma tu correo", bodyHtml: "<p>Confirma tu correo para activar tu cuenta de StakeControl y proteger el acceso a tus tickets.</p>", bodyText: "Confirma tu correo para activar tu cuenta de StakeControl y proteger el acceso a tus tickets.", ctaLabel: "Confirmar correo", ctaUrl: verificationUrl, footerNote: "El enlace vence en 24 horas. Si no creaste esta cuenta, puedes ignorar este correo." });
      const response = await this.dependencies.client.send({
        to: email,
        subject: "Confirma tu correo de StakeControl",
        fromName: "StakeControl Seguridad",
        sender: "security",
        idempotencyKey: dedupeKey,
        ...template,
      });
      await markSentSafely(this.dependencies.repository, pending.id, response.id);
      return { delivered: true, deliveryId: pending.id };
    } catch (error) {
      console.error("Transactional email delivery failed.", { kind: "EMAIL_VERIFICATION" });
      this.reportDeliveryFailure(userId);
      await markFailedSafely(this.dependencies.repository, pending.id, deliveryFailureReason());
      return { delivered: false, deliveryId: pending.id };
    }
  }

  async sendPasswordChanged({ userId, email, changedAt }: PasswordChangedInput) {
    const pending = await createPendingDelivery(this.dependencies.repository, { userId, email, dedupeKey: `password-changed:${userId}:${changedAt.toISOString()}`, kind: "PASSWORD_CHANGED" });
    if (!pending) return { delivered: false };

    try {
      const template = renderEmailTemplate({ eyebrow: "Seguridad", title: "Tu contraseña fue modificada", bodyHtml: "<p>La contraseña de tu cuenta fue modificada correctamente.</p><p>Si no realizaste este cambio, responde a este correo o contacta de inmediato a support@getstakecontrol.com.</p>", bodyText: "La contraseña de tu cuenta fue modificada correctamente. Si no realizaste este cambio, responde a este correo o contacta de inmediato a support@getstakecontrol.com.", ctaLabel: "Contactar soporte", ctaUrl: "mailto:support@getstakecontrol.com", footerNote: "Este es un aviso de seguridad de tu cuenta." });
      const response = await this.dependencies.client.send({
        to: email,
        subject: "Tu contraseña de StakeControl fue modificada",
        fromName: "StakeControl Seguridad",
        sender: "security",
        idempotencyKey: `password-changed:${userId}:${changedAt.toISOString()}`,
        ...template,
      });
      await markSentSafely(this.dependencies.repository, pending.id, response.id);
      return { delivered: true, deliveryId: pending.id };
    } catch (error) {
      console.error("Transactional email delivery failed.", { kind: "PASSWORD_CHANGED" });
      this.reportDeliveryFailure(userId);
      await markFailedSafely(this.dependencies.repository, pending.id, deliveryFailureReason());
      return { delivered: false, deliveryId: pending.id };
    }
  }

  async sendEmailChanged({ userId, email, previousEmail, changedAt }: EmailChangedInput) {
    const dedupeKey = `email-changed:${userId}:${changedAt.toISOString()}`;
    const pending = await createPendingDelivery(this.dependencies.repository, { userId, email, dedupeKey, kind: "EMAIL_CHANGED" });
    if (!pending) return { delivered: false };

    try {
      const template = renderEmailTemplate({ eyebrow: "Seguridad", title: "Tu correo fue modificado", bodyHtml: `<p>El correo de tu cuenta fue cambiado desde ${previousEmail}.</p><p>Si no autorizaste este cambio, responde a este correo o contacta de inmediato a support@getstakecontrol.com.</p>`, bodyText: `El correo de tu cuenta fue cambiado desde ${previousEmail}. Si no autorizaste este cambio, responde a este correo o contacta de inmediato a support@getstakecontrol.com.`, ctaLabel: "Contactar soporte", ctaUrl: "mailto:support@getstakecontrol.com", footerNote: "Este es un aviso de seguridad de tu cuenta." });
      const response = await this.dependencies.client.send({ to: email, subject: "Tu correo de StakeControl fue modificado", fromName: "StakeControl Seguridad", sender: "security", idempotencyKey: dedupeKey, ...template });
      await markSentSafely(this.dependencies.repository, pending.id, response.id);
      return { delivered: true, deliveryId: pending.id };
    } catch {
      console.error("Transactional email delivery failed.", { kind: "EMAIL_CHANGED" });
      this.reportDeliveryFailure(userId);
      await markFailedSafely(this.dependencies.repository, pending.id, deliveryFailureReason());
      return { delivered: false, deliveryId: pending.id };
    }
  }

  async sendAccountDeleted({ userId, email, deletedAt }: AccountDeletedInput) {
    const dedupeKey = `account-deleted:${userId}:${deletedAt.toISOString()}`;
    const pending = await createPendingDelivery(this.dependencies.repository, { userId, email, dedupeKey, kind: "ACCOUNT_DELETED" });
    if (!pending) return { delivered: false };

    try {
      const template = renderEmailTemplate({ eyebrow: "Seguridad", title: "Tu cuenta fue eliminada", bodyHtml: "<p>Tu cuenta de StakeControl y sus datos asociados fueron eliminados según tu solicitud.</p><p>Si no realizaste esta acción, contacta de inmediato a support@getstakecontrol.com.</p>", bodyText: "Tu cuenta de StakeControl y sus datos asociados fueron eliminados según tu solicitud. Si no realizaste esta acción, contacta de inmediato a support@getstakecontrol.com.", ctaLabel: "Contactar soporte", ctaUrl: "mailto:support@getstakecontrol.com", footerNote: "Este es un aviso de seguridad de tu cuenta." });
      const response = await this.dependencies.client.send({ to: email, subject: "Tu cuenta de StakeControl fue eliminada", fromName: "StakeControl Seguridad", sender: "security", idempotencyKey: dedupeKey, ...template });
      await markSentSafely(this.dependencies.repository, pending.id, response.id);
      return { delivered: true, deliveryId: pending.id };
    } catch {
      console.error("Transactional email delivery failed.", { kind: "ACCOUNT_DELETED" });
      this.reportDeliveryFailure(userId);
      await markFailedSafely(this.dependencies.repository, pending.id, deliveryFailureReason());
      return { delivered: false, deliveryId: pending.id };
    }
  }

  async sendResponsibleGamingAlert({ userId, alertId, email, title, message, alertsUrl }: AlertInput) {
    const pending = await createPendingDelivery(this.dependencies.repository, { userId, email, alertId, dedupeKey: `responsible-alert:${alertId}`, kind: "RESPONSIBLE_GAMING_ALERT" });
    if (!pending) return { delivered: false };
    try {
      const template = renderEmailTemplate({ eyebrow: "Alerta preventiva", title, bodyHtml: `<p>${message}</p>`, bodyText: message, ctaLabel: "Ver alertas", ctaUrl: alertsUrl, footerNote: "Puedes ajustar estas alertas desde Configuración." });
      const response = await this.dependencies.client.send({ to: email, subject: title, sender: "alerts", idempotencyKey: `responsible-alert:${alertId}`, ...template });
      await markSentSafely(this.dependencies.repository, pending.id, response.id);
      return { delivered: true, deliveryId: pending.id };
    } catch (error) {
      console.error("Transactional email delivery failed.", { kind: "RESPONSIBLE_GAMING_ALERT" });
      this.reportDeliveryFailure(userId);
      await markFailedSafely(this.dependencies.repository, pending.id, deliveryFailureReason());
      return { delivered: false, deliveryId: pending.id };
    }
  }
}
