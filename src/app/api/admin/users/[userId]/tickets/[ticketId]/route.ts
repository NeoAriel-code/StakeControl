import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { recordAdminContentAccess } from "@/lib/admin-audit";
import prisma from "@/lib/prisma";

const paramsSchema = z.object({
  userId: z.string().trim().min(1).max(128),
  ticketId: z.string().trim().min(1).max(128),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string; ticketId: string }> },
) {
  const administrator = await getCurrentUser();
  if (!isAdminUser(administrator)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ error: "Solicitud no válida" }, { status: 400 });

  const ticket = await prisma.betTicketImage.findFirst({
    where: { id: parsed.data.ticketId, userId: parsed.data.userId },
    select: {
      id: true,
      uploadedAt: true,
      fileName: true,
      mimeType: true,
      fileSizeBytes: true,
      aiExtraction: {
        select: { status: true, provider: true, confidence: true, rawText: true, extractedData: true },
      },
      bet: {
        select: { id: true, title: true, sportsbook: true, result: true, stake: true, odds: true, profitLoss: true },
      },
    },
  });
  if (!ticket) return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });

  await recordAdminContentAccess({
    administratorId: administrator!.id,
    affectedUserId: parsed.data.userId,
    resource: "ticket",
    resourceId: ticket.id,
  });

  return NextResponse.json({
    ticket: {
      ...ticket,
      fileUrl: `/api/admin/users/${encodeURIComponent(parsed.data.userId)}/tickets/${encodeURIComponent(ticket.id)}/file`,
    },
  }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
