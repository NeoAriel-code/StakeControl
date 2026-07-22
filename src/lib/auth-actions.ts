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
import { PlanType, Prisma } from "@prisma/client";
import { COUNTRY_CODES, getCountryRegistrationDefaults } from "@/lib/countries";
import { formatRateLimitMessage, checkRateLimit } from "@/lib/rate-limit";
import { getStorageService, isPrivateStorageReference } from "@/lib/storage";
import { getEmailDeliveryService } from "@/lib/email/email-service";
import { buildNotificationPreferences } from "@/lib/notification-preferences";

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
    country: z.enum(COUNTRY_CODES, {
      error: "Selecciona un país válido.",
    }),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string(),
    ageConfirmed: z.literal(true, {
      error: "Debes confirmar que eres mayor de edad.",
    }),
    termsAccepted: z.literal(true, {
      error: "Debes aceptar los términos y la política de privacidad.",
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

const optionalOnboardingLimitSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? Number(value) : null))
  .pipe(z.number().min(0, "Los límites deben ser mayores o iguales a 0.").nullable());

const onboardingSchema = z.object({
  ageConfirmed: z.boolean(),
  platformDisclaimerAccepted: z.literal(true, {
    error: "Debes confirmar que StakeControl no recomienda apuestas.",
  }),
  performanceDisclaimerAccepted: z.literal(true, {
    error: "Debes confirmar que el rendimiento pasado no garantiza resultados futuros.",
  }),
  termsAccepted: z.boolean(),
  preferredSports: z.array(z.string().trim().min(1)).max(6).default([]),
  weeklyStakeLimit: optionalOnboardingLimitSchema,
  monthlyStakeLimit: optionalOnboardingLimitSchema,
  maxStakePerBet: optionalOnboardingLimitSchema,
  emailAlertsEnabled: z.boolean(),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function toDecimalOrNull(value: number | null) {
  return value === null ? null : new Prisma.Decimal(value.toString());
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
  const rateLimit = await checkRateLimit({
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
    country: getString(formData, "country"),
    password: getString(formData, "password"),
    confirmPassword: getString(formData, "confirmPassword"),
    ageConfirmed: formData.get("ageConfirmed") === "on",
    termsAccepted: formData.get("termsAccepted") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos de registro." };
  }

  const { email, name, password } = parsed.data;
  const registrationDefaults = getCountryRegistrationDefaults(parsed.data.country);
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "Ese email ya está registrado." };
  }

  const passwordHash = hashPassword(password);
  const now = new Date();

  const user = await prisma.user.create({
    data: {
      email,
      name: name || null,
      country: registrationDefaults.countryCode,
      currency: registrationDefaults.currency,
      timezone: registrationDefaults.timezone,
      ageConfirmed: true,
      termsAcceptedAt: now,
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

  const emailService = getEmailDeliveryService();
  if (emailService) {
    void emailService.sendWelcome({ userId: user.id, email: user.email, name: user.name }).catch((error) => {
      console.error("Failed to send welcome email.", error);
    });
  }

  await createSession(user.id);
  redirect("/onboarding");
}

export async function completeOnboardingAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const user = await requireUser({ allowIncompleteOnboarding: true });

  const parsed = onboardingSchema.safeParse({
    ageConfirmed: user.ageConfirmed || formData.get("ageConfirmed") === "on",
    platformDisclaimerAccepted: formData.get("platformDisclaimerAccepted") === "on",
    performanceDisclaimerAccepted: formData.get("performanceDisclaimerAccepted") === "on",
    termsAccepted: Boolean(user.termsAcceptedAt) || formData.get("termsAccepted") === "on",
    preferredSports: formData.getAll("preferredSports").map((value) => String(value)),
    weeklyStakeLimit: getString(formData, "weeklyStakeLimit"),
    monthlyStakeLimit: getString(formData, "monthlyStakeLimit"),
    maxStakePerBet: getString(formData, "maxStakePerBet"),
    emailAlertsEnabled: formData.get("emailAlertsEnabled") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Debes completar el onboarding para continuar." };
  }

  if (!parsed.data.ageConfirmed || !parsed.data.termsAccepted) {
    return { error: "Debes aceptar todas las confirmaciones para continuar." };
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        ageConfirmed: true,
        responsibleGamingAcceptedAt: now,
        termsAcceptedAt: user.termsAcceptedAt ?? now,
        onboardingCompletedAt: now,
        preferredSports:
          parsed.data.preferredSports.length > 0 ? parsed.data.preferredSports.join(",") : null,
      },
    });

    await tx.userLimits.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        weeklyStakeLimit: toDecimalOrNull(parsed.data.weeklyStakeLimit),
        monthlyStakeLimit: toDecimalOrNull(parsed.data.monthlyStakeLimit),
        maxStakePerBet: toDecimalOrNull(parsed.data.maxStakePerBet),
      },
      update: {
        weeklyStakeLimit: toDecimalOrNull(parsed.data.weeklyStakeLimit),
        monthlyStakeLimit: toDecimalOrNull(parsed.data.monthlyStakeLimit),
        maxStakePerBet: toDecimalOrNull(parsed.data.maxStakePerBet),
      },
    });

    await tx.notificationPreferences.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...buildNotificationPreferences(parsed.data.emailAlertsEnabled) },
      update: buildNotificationPreferences(parsed.data.emailAlertsEnabled),
    });
  });

  redirect("/health");
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
