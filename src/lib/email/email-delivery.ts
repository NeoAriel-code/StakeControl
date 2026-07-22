export type EmailClient = {
  send(input: { to: string; subject: string; html: string; text: string }): Promise<{ id: string }>;
};

export type EmailDeliveryRepository = {
  createPending(input: { userId: string; dedupeKey: string; kind: "WELCOME" | "PASSWORD_RESET" | "RESPONSIBLE_GAMING_ALERT"; alertId?: string }): Promise<{ id: string } | null>;
  markSent(id: string, update: { status: "SENT"; providerMessageId: string }): Promise<void>;
  markFailed(id: string, update: { status: "FAILED"; failureReason: string }): Promise<void>;
};

type WelcomeInput = { userId: string; email: string; name?: string | null };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

function safeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "No se pudo enviar el correo.";
  return message.slice(0, 500);
}

export class EmailDeliveryService {
  constructor(private readonly dependencies: { client: EmailClient; repository: EmailDeliveryRepository }) {}

  async sendWelcome({ userId, email, name }: WelcomeInput) {
    const pending = await this.dependencies.repository.createPending({ userId, dedupeKey: `welcome:${userId}`, kind: "WELCOME" });
    if (!pending) return { delivered: false };

    const recipientName = escapeHtml(name?.trim() || "");
    try {
      const response = await this.dependencies.client.send({
        to: email,
        subject: "Bienvenido a StakeControl",
        html: `<p>Hola${recipientName ? ` ${recipientName}` : ""},</p><p>Tu cuenta de StakeControl está lista. Puedes registrar tu actividad y configurar tus alertas preventivas cuando quieras.</p>`,
        text: `Hola${name?.trim() ? ` ${name.trim()}` : ""},\n\nTu cuenta de StakeControl está lista. Puedes registrar tu actividad y configurar tus alertas preventivas cuando quieras.`,
      });
      await this.dependencies.repository.markSent(pending.id, { status: "SENT", providerMessageId: response.id });
      return { delivered: true, deliveryId: pending.id };
    } catch (error) {
      await this.dependencies.repository.markFailed(pending.id, { status: "FAILED", failureReason: safeErrorMessage(error) });
      return { delivered: false, deliveryId: pending.id };
    }
  }
}
