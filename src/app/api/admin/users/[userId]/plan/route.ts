import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import prisma from "@/lib/prisma";
import { PlanType } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { userId } = await params;
    const body = await request.json();
    const { planType } = body;

    if (!["FREE", "PREMIUM_MONTHLY", "PREMIUM_ANNUAL"].includes(planType)) {
      return NextResponse.json({ error: "Tipo de plan no válido" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Cancel existing active subscriptions
    await prisma.subscription.updateMany({
      where: {
        userId,
        status: "active",
      },
      data: {
        status: "canceled",
        canceledAt: new Date(),
      },
    });

    // Create new active subscription
    const now = new Date();
    const periodEnd = new Date();
    if (planType === "PREMIUM_MONTHLY") {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else if (planType === "PREMIUM_ANNUAL") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const newSub = await prisma.subscription.create({
      data: {
        userId,
        planType: planType as PlanType,
        status: "active",
        startedAt: now,
        currentPeriodStart: now,
        currentPeriodEnd: planType === "FREE" ? null : periodEnd,
      },
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
