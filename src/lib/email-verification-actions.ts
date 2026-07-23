"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { createEmailVerificationToken } from "@/lib/email-verification";
import { getEmailDeliveryService } from "@/lib/email/email-service";
import { checkRateLimit, formatRateLimitMessage } from "@/lib/rate-limit";

export type EmailVerificationActionState = {
  error?: string;
  success?: string;
};

const emailSchema = z.string().trim().toLowerCase().email("Ingresa un email válido.");

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
}

export async function sendEmailVerification(user: { id: string; email: string }) {
  const appUrl = getAppUrl();
  const service = getEmailDeliveryService();

  if (!appUrl || !service) {
    return false;
  }

  const token = await createEmailVerificationToken(user.id);
  const result = await service.sendEmailVerification({
    userId: user.id,
    email: user.email,
    token,
    verificationUrl: `${appUrl}/verify-email?token=${encodeURIComponent(token)}`,
  });

  return result.delivered;
}

export async function requestEmailVerificationAction(
  _previousState: EmailVerificationActionState,
  formData: FormData,
): Promise<EmailVerificationActionState> {
  const parsedEmail = emailSchema.safeParse(formData.get("email"));

  if (!parsedEmail.success) {
    return { error: parsedEmail.error.issues[0]?.message ?? "Ingresa un email válido." };
  }

  const rateLimit = await checkRateLimit({
    key: `email-verification-resend:${parsedEmail.data}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return { error: formatRateLimitMessage(rateLimit.resetAt) };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsedEmail.data },
    select: { id: true, email: true, emailVerifiedAt: true },
  });

  if (user && !user.emailVerifiedAt) {
    await sendEmailVerification(user);
  }

  return { success: "Si existe una cuenta sin verificar para ese correo, te enviaremos un nuevo enlace." };
}
