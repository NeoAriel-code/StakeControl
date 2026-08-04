import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import prisma from "@/lib/prisma";

const userIdSchema = z.string().trim().min(1).max(128);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const administrator = await getCurrentUser();
  if (!isAdminUser(administrator)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const parsedUserId = userIdSchema.safeParse((await params).userId);
  if (!parsedUserId.success) {
    return NextResponse.json({ error: "Solicitud no válida" }, { status: 400 });
  }
  const userId = parsedUserId.data;

  const [targetUser, tickets, bets] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } }),
    prisma.betTicketImage.findMany({
      where: { userId },
      orderBy: { uploadedAt: "desc" },
      take: 30,
      select: {
        id: true,
        uploadedAt: true,
        mimeType: true,
        fileSizeBytes: true,
        aiExtraction: { select: { status: true } },
        bet: { select: { id: true, result: true } },
      },
    }),
    prisma.bet.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, createdAt: true, result: true, _count: { select: { ticketImages: true } } },
    }),
  ]);

  if (!targetUser) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    user: targetUser,
    tickets,
    bets: bets.map(({ _count, ...bet }) => ({ ...bet, hasTicket: _count.ticketImages > 0 })),
  }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
