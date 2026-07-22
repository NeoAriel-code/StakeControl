import { renderEmailTemplate } from "@/lib/email/email-templates";

export type EmailClient = {
  send(input: { to: string; subject: string; html: string; text: string }): Promise<{ id: string }>;
};

export type EmailDeliveryRepository = {
  createPending(input: { userId: string; dedupeKey: string; kind: "WELCOME" | "PASSWORD_RESET" | "RESPONSIBLE_GAMING_ALERT"; alertId?: string }): Promise<{ id: string } | null>;
  markSent(id: string, update: { status: "SENT"; providerMessageId: string }): Promise<void>;
  markFailed(id: string, update: { status: "FAILED"; failureReason: string }): Promise<void>;
};

type WelcomeInput = { userId: string; email: string };
type PasswordResetInput = { userId: string; email: string; resetUrl: string; token: string };
type AlertInput = { userId: string; alertId: string; email: string; title: string; message: string; alertsUrl: string };

function safeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "No se pudo enviar el correo.";
  return message.slice(0, 500);
}

async function markSentSafely(repository: EmailDeliveryRepository, id: string, providerMessageId: string) {
  try { await repository.markSent(id, { status: "SENT", providerMessageId }); } catch { /* delivery was accepted; ledger is best effort */ }
}

async function markFailedSafely(repository: EmailDeliveryRepository, id: string, failureReason: string) {
  try { await repository.markFailed(id, { status: "FAILED", failureReason }); } catch { /* provider failure must not break the caller */ }
}

export class EmailDeliveryService {
  constructor(private readonly dependencies: { client: EmailClient; repository: EmailDeliveryRepository }) {}

  async sendWelcome({ userId, email }: WelcomeInput) {
    const pending = await this.dependencies.repository.createPending({ userId, dedupeKey: `welcome:${userId}`, kind: "WELCOME" });
    if (!pending) return { delivered: false };

    try {
      const template = renderEmailTemplate({ eyebrow: "Cuenta lista", title: "Bienvenido a StakeControl", bodyHtml: "<p>Hola,</p><p>Tu cuenta está lista. Puedes registrar tu actividad y configurar alertas preventivas cuando quieras.</p>", bodyText: "Hola. Tu cuenta de StakeControl está lista.", ctaLabel: "Ir a StakeControl", ctaUrl: "https://app.getstakecontrol.com/dashboard", footerNote: "Este es un correo transaccional de tu cuenta." });
      const response = await this.dependencies.client.send({
        to: email,
        subject: "Bienvenido a StakeControl",
        ...template,
      });
      await markSentSafely(this.dependencies.repository, pending.id, response.id);
      return { delivered: true, deliveryId: pending.id };
    } catch (error) {
      await markFailedSafely(this.dependencies.repository, pending.id, safeErrorMessage(error));
      return { delivered: false, deliveryId: pending.id };
    }
  }

  async sendPasswordReset({ userId, email, resetUrl, token }: PasswordResetInput) {
    const tokenHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    const dedupeKey = `password-reset:${Buffer.from(tokenHash).toString("hex")}`;
    const pending = await this.dependencies.repository.createPending({ userId, dedupeKey, kind: "PASSWORD_RESET" });
    if (!pending) return { delivered: false };

    try {
      const template = renderEmailTemplate({ eyebrow: "Seguridad", title: "Restablece tu contraseña", bodyHtml: "<p>Recibimos una solicitud para restablecer tu contraseña.</p>", bodyText: "Recibimos una solicitud para restablecer tu contraseña.", ctaLabel: "Restablecer contraseña", ctaUrl: resetUrl, footerNote: "El enlace vence en una hora. Si no hiciste esta solicitud, ignora este correo." });
      const response = await this.dependencies.client.send({
        to: email,
        subject: "Restablece tu contraseña de StakeControl",
        ...template,
      });
      await markSentSafely(this.dependencies.repository, pending.id, response.id);
      return { delivered: true, deliveryId: pending.id };
    } catch (error) {
      await markFailedSafely(this.dependencies.repository, pending.id, safeErrorMessage(error));
      return { delivered: false, deliveryId: pending.id };
    }
  }

  async sendResponsibleGamingAlert({ userId, alertId, email, title, message, alertsUrl }: AlertInput) {
    const pending = await this.dependencies.repository.createPending({ userId, alertId, dedupeKey: `responsible-alert:${alertId}`, kind: "RESPONSIBLE_GAMING_ALERT" });
    if (!pending) return { delivered: false };
    try {
      const template = renderEmailTemplate({ eyebrow: "Alerta preventiva", title, bodyHtml: `<p>${message}</p>`, bodyText: message, ctaLabel: "Ver alertas", ctaUrl: alertsUrl, footerNote: "Puedes ajustar estas alertas desde Configuración." });
      const response = await this.dependencies.client.send({ to: email, subject: title, ...template });
      await markSentSafely(this.dependencies.repository, pending.id, response.id);
      return { delivered: true, deliveryId: pending.id };
    } catch (error) {
      await markFailedSafely(this.dependencies.repository, pending.id, safeErrorMessage(error));
      return { delivered: false, deliveryId: pending.id };
    }
  }
}
