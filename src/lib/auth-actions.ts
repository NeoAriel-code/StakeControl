"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  clearSession,
  createSession,
  getPostAuthRedirect,
  hashPassword,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { PlanType } from "@prisma/client";
import { formatRateLimitMessage, checkRateLimit } from "@/lib/rate-limit";
import { getStorageService, isPrivateStorageReference } from "@/lib/storage";

export type AuthActionState = {
  error?: string;
};

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Ingresa un email válido."),
  password: z.string().min(1, "Ingresa tu contraseña."),
});

const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Ingresa un email válido."),
    name: z.string().trim().max(100, "El nombre es demasiado largo.").optional(),
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

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa tus credenciales." };
  }

  const { email, password } = parsed.data;
  const rateLimit = checkRateLimit({
    key: `login:${email}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return { error: formatRateLimitMessage(rateLimit.resetAt) };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Credenciales incorrectas." };
  }

  await createSession(user.id);
  redirect(getPostAuthRedirect(user));
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    email: getString(formData, "email"),
    name: getString(formData, "name") || undefined,
    password: getString(formData, "password"),
    confirmPassword: getString(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos de registro." };
  }

  const { email, name, password } = parsed.data;
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "Ese email ya está registrado." };
  }

  const passwordHash = hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      name: name || null,
      passwordHash,
      subscriptions: {
        create: {
          planType: PlanType.FREE,
          status: "active",
        },
      },
      limits: {
        create: {},
      },
    },
  });

  await createSession(user.id);
  redirect("/onboarding");
}

export async function completeOnboardingAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const user = await requireUser({ allowIncompleteOnboarding: true });

  const ageConfirmed = formData.get("ageConfirmed") === "on";
  const platformDisclaimerAccepted = formData.get("platformDisclaimerAccepted") === "on";
  const performanceDisclaimerAccepted = formData.get("performanceDisclaimerAccepted") === "on";
  const termsAccepted = formData.get("termsAccepted") === "on";

  if (!ageConfirmed || !platformDisclaimerAccepted || !performanceDisclaimerAccepted || !termsAccepted) {
    return { error: "Debes aceptar todas las confirmaciones para continuar." };
  }

  const now = new Date();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      ageConfirmed: true,
      responsibleGamingAcceptedAt: now,
      termsAcceptedAt: now,
      onboardingCompletedAt: now,
    },
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function deleteAccountAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const user = await requireUser();
  const confirmation = getString(formData, "confirmation");

  if (confirmation !== "ELIMINAR") {
    return { error: "Debes escribir ELIMINAR para confirmar la eliminación de cuenta." };
  }

  const ticketImages = await prisma.betTicketImage.findMany({
    where: { userId: user.id },
    select: { imageUrl: true },
  });
  const storage = getStorageService();

  for (const ticketImage of ticketImages) {
    if (isPrivateStorageReference(ticketImage.imageUrl)) {
      await storage.deletePrivateObject(ticketImage.imageUrl);
    }
  }

  await prisma.user.delete({
    where: { id: user.id },
  });

  await clearSession();
  redirect("/login");
}
