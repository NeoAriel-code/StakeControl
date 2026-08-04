import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import prisma from "@/lib/prisma";
import { PlanType } from "@prisma/client";
import { z } from "zod";

const planUpdateSchema = z.object({ planType: z.nativeEnum(PlanType) }).strict();
const userIdSchema = z.string().trim().min(1).max(128);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const parsedUserId = userIdSchema.safeParse((await params).userId);
    const parsedBody = planUpdateSchema.safeParse(await request.json());
    if (!parsedUserId.success || !parsedBody.success) {
      return NextResponse.json({ error: "Tipo de plan no válido" }, { status: 400 });
    }
    const userId = parsedUserId.data;
    const { planType } = parsedBody.data;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    if (planType === "PREMIUM_MONTHLY") {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else if (planType === "PREMIUM_ANNUAL") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const newSub = await prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: { userId, status: "active" },
        data: { status: "canceled", canceledAt: now },
      });
      return tx.subscription.create({
        data: {
          userId,
          planType,
          status: "active",
          startedAt: now,
          currentPeriodStart: now,
          currentPeriodEnd: planType === "FREE" ? null : periodEnd,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Plan actualizado a ${planType}`,
      subscription: newSub,
    });
  } catch (error) {
    console.error("Error updating user plan:", error);
    return NextResponse.json({ error: "Error al actualizar plan del usuario" }, { status: 500 });
  }
}
