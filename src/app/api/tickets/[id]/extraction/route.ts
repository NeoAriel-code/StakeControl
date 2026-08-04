import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { enqueueTicketExtraction } from "@/lib/ticket-workflow";

const headers = { "Cache-Control": "private, no-store, max-age=0" };
const completedStatuses = new Set(["ready_for_review", "requires_review", "reviewed_and_confirmed"]);

async function findExtraction(id: string, userId: string) {
  return prisma.aIExtraction.findFirst({
    where: { betTicketImage: { id, userId } },
    select: { id: true, status: true, updatedAt: true, attemptCount: true },
  });
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401, headers });
  const { id } = await context.params;
  const extraction = await findExtraction(id, user.id);
  if (!extraction) return NextResponse.json({ error: "No encontrado" }, { status: 404, headers });

  return NextResponse.json({
    status: extraction.status,
    ready: completedStatuses.has(extraction.status),
    canRetry: extraction.status === "failed" || Date.now() - extraction.updatedAt.getTime() >= 120_000,
    attemptCount: extraction.attemptCount,
  }, { headers });
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401, headers });
  const { id } = await context.params;
  const extraction = await findExtraction(id, user.id);
  if (!extraction) return NextResponse.json({ error: "No encontrado" }, { status: 404, headers });
  if (completedStatuses.has(extraction.status)) {
    return NextResponse.json({ status: extraction.status, ready: true }, { headers });
  }
  if (extraction.status !== "failed" && Date.now() - extraction.updatedAt.getTime() < 120_000) {
    return NextResponse.json({ error: "La extracción todavía está activa." }, { status: 409, headers });
  }

  const rateLimit = await checkRateLimit({ key: `ticket-extraction-retry:${user.id}:${id}`, limit: 3, windowMs: 10 * 60_000 });
  if (!rateLimit.allowed) return NextResponse.json({ error: "Espera antes de volver a intentar." }, { status: 429, headers });

  await prisma.aIExtraction.updateMany({
    where: { id: extraction.id, status: extraction.status },
    data: { status: "queued", failedAt: null },
  });
  try {
    await enqueueTicketExtraction(extraction.id);
    return NextResponse.json({ status: "queued" }, { status: 202, headers });
  } catch {
    await prisma.aIExtraction.updateMany({
      where: { id: extraction.id },
      data: { status: "failed", failedAt: new Date() },
    });
    return NextResponse.json({ error: "No se pudo reanudar el procesamiento." }, { status: 503, headers });
  }
}
