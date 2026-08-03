import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { isAdminUser } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { withDatabaseSpan } from "@/lib/observability/database-spans";

type OcrMetricRow = {
  provider: string;
  model: string;
  confidenceBand: string;
  total: number | bigint;
  completelyCorrect: number | bigint;
  partiallyCorrect: number | bigint;
  incorrect: number | bigint;
};

export async function GET() {
  if (!isAdminUser(await getCurrentUser())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const rows = await withDatabaseSpan(
    "admin.ocr-feedback.metrics",
    "aggregate",
    () => prisma.$queryRaw<OcrMetricRow[]>(Prisma.sql`
      SELECT
        COALESCE("AIExtraction"."provider", 'unknown') AS "provider",
        COALESCE("AIExtraction"."model", 'unknown') AS "model",
        CASE
          WHEN "AIExtraction"."confidence" IS NULL THEN 'low'
          WHEN CAST("AIExtraction"."confidence" AS REAL) < 0.5 THEN 'low'
          WHEN CAST("AIExtraction"."confidence" AS REAL) < 0.85 THEN 'medium'
          ELSE 'high'
        END AS "confidenceBand",
        COUNT(*) AS "total",
        SUM(CASE WHEN "OcrExtractionFeedback"."rating" = 'COMPLETELY_CORRECT' THEN 1 ELSE 0 END)
          AS "completelyCorrect",
        SUM(CASE WHEN "OcrExtractionFeedback"."rating" = 'PARTIALLY_CORRECT' THEN 1 ELSE 0 END)
          AS "partiallyCorrect",
        SUM(CASE WHEN "OcrExtractionFeedback"."rating" = 'INCORRECT' THEN 1 ELSE 0 END)
          AS "incorrect"
      FROM "OcrExtractionFeedback"
      INNER JOIN "AIExtraction"
        ON "AIExtraction"."id" = "OcrExtractionFeedback"."aiExtractionId"
      GROUP BY "provider", "model", "confidenceBand"
      ORDER BY "provider", "model", "confidenceBand"
    `),
    (result) => result.length,
  );
  const metrics = rows.map((row) => {
    const total = Number(row.total);
    const completelyCorrect = Number(row.completelyCorrect);
    const partiallyCorrect = Number(row.partiallyCorrect);
    const incorrect = Number(row.incorrect);
    return {
      provider: row.provider,
      model: row.model,
      confidenceBand: row.confidenceBand,
      total,
      completelyCorrect,
      partiallyCorrect,
      incorrect,
      completelyCorrectPercent: Math.round(completelyCorrect / total * 100),
      partiallyCorrectPercent: Math.round(partiallyCorrect / total * 100),
      incorrectPercent: Math.round(incorrect / total * 100),
    };
  });
  return NextResponse.json({ metrics });
}
