import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { userId } = await params;

    const [targetUser, tickets, bets] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true },
      }),
      prisma.betTicketImage.findMany({
        where: { userId },
        orderBy: { uploadedAt: "desc" },
        take: 30,
        include: {
          aiExtraction: true,
          bet: {
            select: { id: true, title: true, result: true, stake: true, profitLoss: true },
          },
        },
      }),
      prisma.bet.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          title: true,
          stake: true,
          odds: true,
          result: true,
          profitLoss: true,
          createdAt: true,
          sportsbook: true,
        },
      }),
    ]);

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      user: targetUser,
      tickets,
      bets,
    });
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    return NextResponse.json({ error: "Error al obtener tickets del usuario" }, { status: 500 });
  }
}
