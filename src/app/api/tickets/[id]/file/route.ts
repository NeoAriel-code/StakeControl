import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getStorageService, isPrivateStorageReference } from "@/lib/storage";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const ticketImage = await prisma.betTicketImage.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!ticketImage) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!isPrivateStorageReference(ticketImage.imageUrl)) {
    return NextResponse.redirect(ticketImage.imageUrl);
  }

  const storage = getStorageService();
  const storedObject = await storage.getPrivateObject(ticketImage.imageUrl);

  return new NextResponse(new Uint8Array(storedObject.buffer), {
    status: 200,
    headers: {
      "Content-Type": ticketImage.mimeType || storedObject.mimeType,
      "Content-Disposition": `inline; filename="${ticketImage.fileName || storedObject.fileName}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
