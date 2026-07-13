"use server";

import { redirect } from "next/navigation";
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

export type AuthActionState = {
  error?: string;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = normalizeEmail(getString(formData, "email"));
  const password = getString(formData, "password");

  if (!email || !password) {
    return { error: "Ingresa tu email y contraseña." };
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
  const email = normalizeEmail(getString(formData, "email"));
  const name = getString(formData, "name");
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");

  if (!email.includes("@")) {
    return { error: "Ingresa un email válido." };
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

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
