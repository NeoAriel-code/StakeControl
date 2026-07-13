import { NextResponse } from "next/server";
import { AlertType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { getFeatureAccess } from "@/lib/plans";
import prisma from "@/lib/prisma";

const BASIC_ALERT_TYPES: AlertType[] = [
  AlertType.LIMIT_APPROACHING,
  AlertType.LIMIT_EXCEEDED,
];

async function getUnreadAlertWhere(userId: string) {
  const intelligentAlertsAccess = await getFeatureAccess(userId, "alerts_intelligent");

  return {
    userId,
    acknowledgedAt: null,
    ...(intelligentAlertsAccess.allowed
      ? {}
      : {
          type: {
            in: BASIC_ALERT_TYPES,
          },
        }),
  };
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ alerts: [], count: 0 }, { status: 401 });
  }

  const where = await getUnreadAlertWhere(user.id);
  const alerts = await prisma.responsibleGamingAlert.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      message: true,
      severity: true,
      type: true,
      createdAt: true,
    },
  });
  const count = await prisma.responsibleGamingAlert.count({ where });

  return NextResponse.json(
    { alerts, count },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}

export async function PATCH() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ count: 0 }, { status: 401 });
  }

  const where = await getUnreadAlertWhere(user.id);

  await prisma.responsibleGamingAlert.updateMany({
    where,
    data: {
      acknowledgedAt: new Date(),
    },
  });

  return NextResponse.json(
    { count: 0 },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}
