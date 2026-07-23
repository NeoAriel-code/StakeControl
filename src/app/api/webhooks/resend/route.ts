import { NextResponse } from "next/server";
import { Resend } from "resend";
import { emailWebhookRepository } from "@/lib/email/email-service";
import { processEmailWebhookEvent, type VerifiedEmailWebhookEvent } from "@/lib/email/email-webhook";

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) return new NextResponse("Webhook no configurado", { status: 503 });

  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!id || !timestamp || !signature) return new NextResponse("Encabezados de webhook faltantes", { status: 400 });

  try {
    const payload = await request.text();
    const resend = new Resend(process.env.RESEND_API_KEY);
    const verifiedEvent = resend.webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret,
    });
    const event = { ...(verifiedEvent as unknown as Omit<VerifiedEmailWebhookEvent, "id">), id } as VerifiedEmailWebhookEvent;

    await processEmailWebhookEvent(event, emailWebhookRepository);
    return NextResponse.json({ received: true });
  } catch {
    return new NextResponse("Firma de webhook inválida", { status: 401 });
  }
}
