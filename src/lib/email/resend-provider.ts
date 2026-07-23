import { Resend } from "resend";
import type { EmailProvider, TransactionalEmail } from "@/lib/email/email-provider";

export class ResendEmailProvider implements EmailProvider {
  private readonly resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async send(input: TransactionalEmail) {
    const { data, error } = await this.resend.emails.send(
      {
        from: input.from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(input.replyTo ? { replyTo: input.replyTo } : {}),
      },
      { idempotencyKey: input.idempotencyKey },
    );

    if (error || !data?.id) {
      throw new Error(error?.message || "Resend no devolvió un identificador de entrega.");
    }

    return { id: data.id };
  }
}
