"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import {
  createPasswordResetToken,
  resetPasswordWithToken,
} from "@/lib/password-recovery";
import { isPasswordRecoveryEmailConfigured } from "@/lib/password-recovery-email";
import { getEmailDeliveryService } from "@/lib/email/email-service";

export type PasswordRecoveryActionState = {
  error?: string;
  success?: string;
};

const emailSchema = z.string().trim().toLowerCase().email("Ingresa un email válido.");
const passwordSchema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function requestPasswordResetAction(
  _previousState: PasswordRecoveryActionState,
  formData: FormData
): Promise<PasswordRecoveryActionState> {
  const parsedEmail = emailSchema.safeParse(getString(formData, "email"));

  if (!parsedEmail.success) {
    return { error: parsedEmail.error.issues[0]?.message ?? "Ingresa un email válido." };
  }

  if (!isPasswordRecoveryEmailConfigured()) {
    return {
      error: "La recuperación por email aún no está disponible. Escríbenos a contact@getstakecontrol.com.",
    };
  }

  const user = await prisma.user.findUnique({ where: { email: parsedEmail.data } });

  if (user) {
    const token = await createPasswordResetToken(user.id);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

    if (!appUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL debe configurarse antes de habilitar recuperación por email.");
    }

    const service = getEmailDeliveryService();
    if (service) {
      await service.sendPasswordReset({ userId: user.id, email: user.email, token, resetUrl: `${appUrl}/reset-password?token=${encodeURIComponent(token)}` });
    }
  }

  return {
    success: "Si existe una cuenta para ese correo, recibirás instrucciones para restablecer tu contraseña.",
  };
}

export async function resetPasswordAction(
  token: string,
  _previousState: PasswordRecoveryActionState,
  formData: FormData
): Promise<PasswordRecoveryActionState> {
  if (!token) {
    return { error: "El enlace de recuperación no es válido." };
  }

  const parsedPassword = passwordSchema.safeParse({
    password: getString(formData, "password"),
    confirmPassword: getString(formData, "confirmPassword"),
  });

  if (!parsedPassword.success) {
    return { error: parsedPassword.error.issues[0]?.message ?? "Revisa la nueva contraseña." };
  }

  const updated = await resetPasswordWithToken(token, hashPassword(parsedPassword.data.password));

  if (!updated) {
    return { error: "El enlace de recuperación venció o ya fue utilizado. Solicita uno nuevo." };
  }

  redirect("/login?reset=success");
}
