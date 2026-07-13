"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { evaluateResponsibleGamingAlerts } from "@/lib/responsible-gaming";

export type LimitsActionState = {
  error?: string;
  success?: string;
};

function parseOptionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Los límites deben ser números mayores o iguales a 0.");
  }

  return new Prisma.Decimal(parsed.toString());
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
    const dailyStakeLimit = parseOptionalNumber(formData.get("dailyStakeLimit"));
    const weeklyStakeLimit = parseOptionalNumber(formData.get("weeklyStakeLimit"));
    const monthlyStakeLimit = parseOptionalNumber(formData.get("monthlyStakeLimit"));
    const maxStakePerBet = parseOptionalNumber(formData.get("maxStakePerBet"));
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
