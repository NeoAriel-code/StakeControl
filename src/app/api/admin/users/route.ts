import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const querySchema = z.object({
  search: z.string().trim().max(100).default(""),
  plan: z.enum(["ALL", "FREE", "PREMIUM"]).default("ALL"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const parsedQuery = querySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsedQuery.success) {
      return NextResponse.json({ error: "Consulta no válida" }, { status: 400 });
    }
    const { search, plan: filterPlan, page, limit } = parsedQuery.data;
    const skip = (page - 1) * limit;

    const whereCondition: Prisma.UserWhereInput = {};

    if (search.trim()) {
      const query = search.trim();
      whereCondition.OR = [
        { email: { contains: query } },
        { name: { contains: query } },
      ];
    }

    if (filterPlan === "FREE") {
      whereCondition.subscriptions = {
        none: {
          status: "active",
          planType: { in: ["PREMIUM_MONTHLY", "PREMIUM_ANNUAL"] },
        },
      };
    } else if (filterPlan === "PREMIUM") {
      whereCondition.subscriptions = {
        some: {
          status: "active",
          planType: { in: ["PREMIUM_MONTHLY", "PREMIUM_ANNUAL"] },
        },
      };
    }

    const [usersCount, usersList] = await Promise.all([
      prisma.user.count({ where: whereCondition }),
      prisma.user.findMany({
        where: whereCondition,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          country: true,
          isAdmin: true,
          createdAt: true,
          emailVerifiedAt: true,
          limits: {
            select: {
              pauseAllBetting: true,
              pauseUntil: true,
            },
          },
          subscriptions: {
            where: { status: "active" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              planType: true,
              status: true,
              startedAt: true,
              currentPeriodEnd: true,
            },
          },
          _count: {
            select: {
              bets: true,
              betTicketImages: true,
            },
          },
        },
      }),
    ]);

    const formattedUsers = usersList.map((u) => {
      const activeSub = u.subscriptions[0];
      const planType = activeSub ? activeSub.planType : "FREE";

      return {
        id: u.id,
        email: u.email,
        name: u.name || "Sin nombre",
        country: u.country || "-",
        isAdmin: u.isAdmin,
        createdAt: u.createdAt,
        isEmailVerified: Boolean(u.emailVerifiedAt),
        planType,
        subscriptionStatus: activeSub?.status || "active",
        subscriptionEnd: activeSub?.currentPeriodEnd || null,
        ticketsCount: u._count.betTicketImages,
        betsCount: u._count.bets,
        isPaused: u.limits?.pauseAllBetting || false,
      };
    });

    return NextResponse.json({
      users: formattedUsers,
      totalUsers: usersCount,
      page,
      totalPages: Math.ceil(usersCount / limit),
    });
  } catch (error) {
    console.error("Error listing admin users:", error);
    return NextResponse.json({ error: "Error al listar usuarios" }, { status: 500 });
  }
}
