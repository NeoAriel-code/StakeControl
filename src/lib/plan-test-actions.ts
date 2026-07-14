"use server";

import { PlanType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { canUsePlanTestControls } from "@/lib/plan-testing";
import prisma from "@/lib/prisma";

export type PlanTestActionState = {
  error?: string;
  success?: string;
};

const planSchema = z.enum(["FREE", "PREMIUM"]);

const pathsToRevalidate = [
  "/profile",
  "/settings",
  "/upgrade",
  "/dashboard",
  "/tickets",
  "/tickets/upload",
  "/bets",
  "/alerts",
  "/analysis",
  "/reportes",
  "/reports/export",
];

export async function setPlanForTestingAction(
  _previousState: PlanTestActionState,
  formData: FormData
): Promise<PlanTestActionState> {
  const user = await requireUser();

  if (!canUsePlanTestControls(user.email)) {
    return { error: "No tienes permiso para cambiar planes de prueba." };
  }

  const parsed = planSchema.safeParse(formData.get("plan"));
  if (!parsed.success) {
    return { error: "Selecciona un plan válido." };
  }

  const planType = parsed.data === "PREMIUM" ? PlanType.PREMIUM_MONTHLY : PlanType.FREE;
  const activeSubscription = await prisma.subscription.findFirst({
    where: { userId: user.id, status: "active" },
    orderBy: { createdAt: "desc" },
  });

  if (activeSubscription) {
    await prisma.subscription.update({
      where: { id: activeSubscription.id },
      data: {
        planType,
        currentPeriodStart: parsed.data === "PREMIUM" ? new Date() : null,
        currentPeriodEnd: null,
      },
    });
  } else {
    await prisma.subscription.create({
      data: {
        userId: user.id,
        planType,
        status: "active",
        currentPeriodStart: parsed.data === "PREMIUM" ? new Date() : null,
      },
    });
  }

  pathsToRevalidate.forEach((path) => revalidatePath(path));

  return { success: `Plan de prueba cambiado a ${parsed.data === "PREMIUM" ? "Premium" : "Free"}.` };
}
