"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function acknowledgeAlertAction(formData: FormData) {
  const user = await requireUser();
  const alertId = formData.get("alertId");

  if (typeof alertId !== "string" || alertId.length === 0) {
    throw new Error("Falta el identificador de la alerta.");
  }

  await prisma.responsibleGamingAlert.updateMany({
    where: {
      id: alertId,
      userId: user.id,
    },
    data: {
      acknowledgedAt: new Date(),
    },
  });

  revalidatePath("/alerts");
  revalidatePath("/limits");
  revalidatePath("/dashboard");
}
