import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { recordAdminContentAccess } from "@/lib/admin-audit";
import prisma from "@/lib/prisma";
import { getStorageService, isPrivateStorageReference, sanitizeUploadedFileName } from "@/lib/storage";

const paramsSchema = z.object({
  userId: z.string().trim().min(1).max(128),
  ticketId: z.string().trim().min(1).max(128),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string; ticketId: string }> },
) {
  const administrator = await getCurrentUser();
  if (!isAdminUser(administrator)) return new NextResponse("Forbidden", { status: 403 });
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return new NextResponse("Bad request", { status: 400 });
  const ticket = await prisma.betTicketImage.findFirst({ where: { id: parsed.data.ticketId, userId: parsed.data.userId } });
  if (!ticket) return new NextResponse("Not found", { status: 404 });

  await recordAdminContentAccess({
    administratorId: administrator!.id,
    affectedUserId: parsed.data.userId,
    resource: "ticket",
    resourceId: ticket.id,
    action: "download",
  });

  if (!isPrivateStorageReference(ticket.imageUrl)) return NextResponse.redirect(ticket.imageUrl);
  const storedObject = await getStorageService().getPrivateObject(ticket.imageUrl);
  return new NextResponse(new Uint8Array(storedObject.buffer), {
    headers: {
      "Content-Type": ticket.mimeType || storedObject.mimeType,
      "Content-Disposition": `inline; filename="${sanitizeUploadedFileName(ticket.fileName || storedObject.fileName)}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
