import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdminUser } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";

function confidenceBand(value: unknown) {
  const confidence = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(confidence)) return "unknown";
  return confidence < 0.5 ? "low" : confidence < 0.85 ? "medium" : "high";
}

export async function GET() {
  if (!isAdminUser(await getCurrentUser())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const rows = await prisma.ocrExtractionFeedback.findMany({
    select: { rating: true, aiExtraction: { select: { provider: true, model: true, confidence: true } } },
  });
  const metrics = new Map<string, { provider: string; model: string; confidenceBand: string; total: number; completelyCorrect: number; partiallyCorrect: number; incorrect: number }>();
  for (const row of rows) {
    const provider = row.aiExtraction.provider ?? "unknown";
    const model = row.aiExtraction.model ?? "unknown";
    const band = confidenceBand(row.aiExtraction.confidence);
    const key = `${provider}\u0000${model}\u0000${band}`;
    const metric = metrics.get(key) ?? { provider, model, confidenceBand: band, total: 0, completelyCorrect: 0, partiallyCorrect: 0, incorrect: 0 };
    metric.total += 1;
    if (row.rating === "COMPLETELY_CORRECT") metric.completelyCorrect += 1;
    if (row.rating === "PARTIALLY_CORRECT") metric.partiallyCorrect += 1;
    if (row.rating === "INCORRECT") metric.incorrect += 1;
    metrics.set(key, metric);
  }
  return NextResponse.json({ metrics: [...metrics.values()].map((metric) => ({ ...metric, completelyCorrectPercent: Math.round(metric.completelyCorrect / metric.total * 100), partiallyCorrectPercent: Math.round(metric.partiallyCorrect / metric.total * 100), incorrectPercent: Math.round(metric.incorrect / metric.total * 100) })) });
}
