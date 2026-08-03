import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { withDatabaseSpan } from "@/lib/observability/database-spans";
import prisma from "@/lib/prisma";

type PlanCountRow = {
  totalUsers: number | bigint;
  freeUsers: number | bigint;
  premiumMonthlyUsers: number | bigint;
  premiumAnnualUsers: number | bigint;
};

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      planCountRows,
      newUsersThisMonth,
      totalTicketsUploaded,
      totalBetsCreated,
      ticketsThisMonth,
    ] = await Promise.all([
      withDatabaseSpan(
        "admin.stats.plan-counts",
        "aggregate",
        () => prisma.$queryRaw<PlanCountRow[]>(Prisma.sql`
          WITH "activeSubscriptions" AS (
            SELECT
              "userId",
              "planType",
              ROW_NUMBER() OVER (
                PARTITION BY "userId" ORDER BY "createdAt" DESC, "id" DESC
              ) AS "position"
            FROM "Subscription"
            WHERE "status" = 'active'
          )
          SELECT
            COUNT(*) AS "totalUsers",
            SUM(CASE
              WHEN "activeSubscriptions"."planType" IS NULL
                OR "activeSubscriptions"."planType" = 'FREE' THEN 1 ELSE 0 END
            ) AS "freeUsers",
            SUM(CASE WHEN "activeSubscriptions"."planType" = 'PREMIUM_MONTHLY' THEN 1 ELSE 0 END)
              AS "premiumMonthlyUsers",
            SUM(CASE WHEN "activeSubscriptions"."planType" = 'PREMIUM_ANNUAL' THEN 1 ELSE 0 END)
              AS "premiumAnnualUsers"
          FROM "User"
          LEFT JOIN "activeSubscriptions"
            ON "activeSubscriptions"."userId" = "User"."id"
            AND "activeSubscriptions"."position" = 1
        `),
        () => 1,
      ),
      prisma.user.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.betTicketImage.count(),
      prisma.bet.count(),
      prisma.betTicketImage.count({
        where: { uploadedAt: { gte: startOfMonth } },
      }),
    ]);
    const planCounts = planCountRows[0];
    const totalUsers = Number(planCounts?.totalUsers ?? 0);
    const freeUsers = Number(planCounts?.freeUsers ?? 0);
    const premiumMonthlyUsers = Number(planCounts?.premiumMonthlyUsers ?? 0);
    const premiumAnnualUsers = Number(planCounts?.premiumAnnualUsers ?? 0);

    const totalPremiumUsers = premiumMonthlyUsers + premiumAnnualUsers;
    const conversionRate = totalUsers > 0 ? ((totalPremiumUsers / totalUsers) * 100).toFixed(1) : "0";

    return NextResponse.json({
      totalUsers,
      newUsersThisMonth,
      freeUsers,
      premiumMonthlyUsers,
      premiumAnnualUsers,
      totalPremiumUsers,
      conversionRate,
      totalTicketsUploaded,
      ticketsThisMonth,
      totalBetsCreated,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 });
  }
}
