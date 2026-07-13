"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { evaluateResponsibleGamingAlerts } from "@/lib/responsible-gaming";

export type LimitsActionState = {
  error?: string;
  success?: string;
};

const optionalLimitSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? Number(value) : null))
  .pipe(z.number().min(0, "Los límites deben ser números mayores o iguales a 0.").nullable());

const limitsSchema = z.object({
  dailyStakeLimit: optionalLimitSchema,
  weeklyStakeLimit: optionalLimitSchema,
  monthlyStakeLimit: optionalLimitSchema,
  maxStakePerBet: optionalLimitSchema,
});

function toDecimalOrNull(value: number | null) {
  return value === null ? null : new Prisma.Decimal(value.toString());
}

function resolvePauseUntil(formData: FormData, currentPauseUntil: Date | null | undefined) {
  const pausePreset = formData.get("pausePreset");

  if (typeof pausePreset !== "string" || pausePreset === "none") {
    return currentPauseUntil ?? null;
  }

  if (pausePreset === "clear") {
    return null;
  }

  const now = new Date();

  if (pausePreset === "24h") {
    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }

  if (pausePreset === "7d") {
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  if (pausePreset === "30d") {
    return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  if (pausePreset === "custom") {
    const customPauseUntil = formData.get("customPauseUntil");

    if (typeof customPauseUntil !== "string" || customPauseUntil.trim() === "") {
      throw new Error("Debes seleccionar una fecha personalizada para la pausa voluntaria.");
    }

    const date = new Date(customPauseUntil);

    if (Number.isNaN(date.getTime()) || date <= now) {
      throw new Error("La fecha de pausa personalizada debe estar en el futuro.");
    }

    return date;
  }

  return null;
}

export async function updateLimitsAction(
  _prevState: LimitsActionState,
  formData: FormData
): Promise<LimitsActionState> {
  const user = await requireUser();

  try {
    const existingLimits = await prisma.userLimits.findUnique({
      where: { userId: user.id },
    });
    const parsedLimits = limitsSchema.parse({
      dailyStakeLimit: formData.get("dailyStakeLimit")?.toString(),
      weeklyStakeLimit: formData.get("weeklyStakeLimit")?.toString(),
      monthlyStakeLimit: formData.get("monthlyStakeLimit")?.toString(),
      maxStakePerBet: formData.get("maxStakePerBet")?.toString(),
    });
    const dailyStakeLimit = toDecimalOrNull(parsedLimits.dailyStakeLimit);
    const weeklyStakeLimit = toDecimalOrNull(parsedLimits.weeklyStakeLimit);
    const monthlyStakeLimit = toDecimalOrNull(parsedLimits.monthlyStakeLimit);
    const maxStakePerBet = toDecimalOrNull(parsedLimits.maxStakePerBet);
    const pauseUntil = resolvePauseUntil(formData, existingLimits?.pauseUntil);

    await prisma.userLimits.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        dailyStakeLimit,
        weeklyStakeLimit,
        monthlyStakeLimit,
        maxStakePerBet,
        pauseUntil,
        pauseAllBetting: Boolean(pauseUntil),
      },
      update: {
        dailyStakeLimit,
        weeklyStakeLimit,
        monthlyStakeLimit,
        maxStakePerBet,
        pauseUntil,
        pauseAllBetting: Boolean(pauseUntil),
      },
    });
    await evaluateResponsibleGamingAlerts(user.id);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudieron guardar los límites.",
    };
  }

  revalidatePath("/limits");
  revalidatePath("/dashboard");
  revalidatePath("/bets");
  revalidatePath("/bets/new");
  revalidatePath("/tickets");

  return {
    success: "Configuración de límites actualizada correctamente.",
  };
}
