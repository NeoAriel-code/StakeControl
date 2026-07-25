import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      newUsersThisMonth,
      totalTicketsUploaded,
      totalBetsCreated,
      ticketsThisMonth,
      allUsersWithSub,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.betTicketImage.count(),
      prisma.bet.count(),
      prisma.betTicketImage.count({
        where: { uploadedAt: { gte: startOfMonth } },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          subscriptions: {
            where: { status: "active" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { planType: true },
          },
        },
      }),
    ]);

    // Calculate plan counts
    let freeUsers = 0;
    let premiumMonthlyUsers = 0;
    let premiumAnnualUsers = 0;

    for (const u of allUsersWithSub) {
      const activeSub = u.subscriptions[0];
      if (!activeSub || activeSub.planType === "FREE") {
        freeUsers++;
      } else if (activeSub.planType === "PREMIUM_MONTHLY") {
        premiumMonthlyUsers++;
      } else if (activeSub.planType === "PREMIUM_ANNUAL") {
        premiumAnnualUsers++;
      }
    }

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
