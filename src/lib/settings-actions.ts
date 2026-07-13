"use server";

import { OddsFormat } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { COUNTRY_CODES } from "@/lib/countries";
import { CURRENCY_CODES } from "@/lib/currencies";
import prisma from "@/lib/prisma";
import { SPORT_OPTIONS } from "@/lib/sports";

export type SettingsActionState = {
  error?: string;
  success?: string;
};

const profilePreferencesSchema = z.object({
  name: z.string().trim().max(100, "El nombre es demasiado largo.").optional(),
  country: z.enum(COUNTRY_CODES, {
    error: "Selecciona un país válido.",
  }),
  currency: z.enum(CURRENCY_CODES, {
    error: "Selecciona una moneda válida.",
  }),
  timezone: z.enum(["America/Santiago", "America/Argentina/Buenos_Aires", "America/Mexico_City", "America/Bogota", "America/Lima", "UTC"], {
    error: "Selecciona una zona horaria válida.",
  }),
  oddsFormat: z.nativeEnum(OddsFormat, {
    error: "Selecciona un formato de cuota válido.",
  }),
  preferredSports: z.array(z.enum(SPORT_OPTIONS)).max(6, "Selecciona hasta 6 deportes principales."),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresa tu contraseña actual."),
    newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirma la nueva contraseña."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Las contraseñas nuevas no coinciden.",
    path: ["confirmPassword"],
  });

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateProfilePreferencesAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const user = await requireUser();
  const parsed = profilePreferencesSchema.safeParse({
    name: getString(formData, "name") || undefined,
    country: getString(formData, "country"),
    currency: getString(formData, "currency"),
    timezone: getString(formData, "timezone"),
    oddsFormat: getString(formData, "oddsFormat"),
    preferredSports: formData.getAll("preferredSports").map((value) => String(value)),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa tus preferencias." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name ?? null,
      country: parsed.data.country,
      currency: parsed.data.currency,
      timezone: parsed.data.timezone,
      oddsFormat: parsed.data.oddsFormat,
      preferredSports:
        parsed.data.preferredSports.length > 0 ? parsed.data.preferredSports.join(",") : null,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return { success: "Preferencias guardadas correctamente." };
}

export async function changePasswordAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const user = await requireUser();
  const parsed = passwordSchema.safeParse({
    currentPassword: getString(formData, "currentPassword"),
    newPassword: getString(formData, "newPassword"),
    confirmPassword: getString(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los campos de contraseña." };
  }

  if (!verifyPassword(parsed.data.currentPassword, user.passwordHash)) {
    return { error: "La contraseña actual no es correcta." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashPassword(parsed.data.newPassword),
    },
  });

  return { success: "Contraseña actualizada correctamente." };
}
