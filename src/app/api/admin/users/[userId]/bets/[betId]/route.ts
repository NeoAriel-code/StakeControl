import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { recordAdminContentAccess } from "@/lib/admin-audit";
import prisma from "@/lib/prisma";

const paramsSchema = z.object({
  userId: z.string().trim().min(1).max(128),
  betId: z.string().trim().min(1).max(128),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string; betId: string }> },
) {
  const administrator = await getCurrentUser();
  if (!isAdminUser(administrator)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ error: "Solicitud no válida" }, { status: 400 });
  const bet = await prisma.bet.findFirst({
    where: { id: parsed.data.betId, userId: parsed.data.userId },
    include: { legs: { orderBy: { position: "asc" } }, ticketImages: { select: { id: true } } },
  });
  if (!bet) return NextResponse.json({ error: "Apuesta no encontrada" }, { status: 404 });

  await recordAdminContentAccess({
    administratorId: administrator!.id,
    affectedUserId: parsed.data.userId,
    resource: "bet",
    resourceId: bet.id,
  });
  return NextResponse.json({ bet }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
