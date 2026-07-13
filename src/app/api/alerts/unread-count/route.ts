import { NextResponse } from "next/server";
import { AlertType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { getFeatureAccess } from "@/lib/plans";
import prisma from "@/lib/prisma";

const BASIC_ALERT_TYPES: AlertType[] = [
  AlertType.LIMIT_APPROACHING,
  AlertType.LIMIT_EXCEEDED,
];

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ count: 0 }, { status: 401 });
  }

  const intelligentAlertsAccess = await getFeatureAccess(user.id, "alerts_intelligent");
  const count = await prisma.responsibleGamingAlert.count({
    where: {
      userId: user.id,
      acknowledgedAt: null,
      ...(intelligentAlertsAccess.allowed
        ? {}
        : {
            type: {
              in: BASIC_ALERT_TYPES,
            },
          }),
    },
  });

  return NextResponse.json(
    { count },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}
