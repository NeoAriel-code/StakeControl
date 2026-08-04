import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { createOcrService, getConfiguredOcrProviderName } from "@/lib/ocr-service";
import { parseTicketWithProviderRouting, TICKET_REVIEW_CONFIDENCE } from "@/lib/ai/ticket-parser";
import { extractedBetTicketSchema } from "@/lib/ticket-extraction";
import { reportAiExtractionSpan, reportOperationalError } from "@/lib/observability/sentry";

function jsonRecord(value: Record<string, unknown>): Prisma.InputJsonObject {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as Prisma.InputJsonObject;
}

export async function processTicketOcrStep(extractionId: string) {
  "use step";

  const extraction = await prisma.aIExtraction.findUnique({
    where: { id: extractionId },
    include: { betTicketImage: { select: { imageUrl: true } } },
  });
  if (!extraction) return { extractionId };
  if (extraction.rawText) {
    await prisma.aIExtraction.updateMany({
      where: { id: extractionId, status: { in: ["queued", "ocr_processing", "failed"] } },
      data: { status: "ai_processing", failedAt: null },
    });
    return { extractionId };
  }

  await prisma.aIExtraction.updateMany({
    where: { id: extractionId, status: { in: ["queued", "ocr_processing", "failed"] } },
    data: {
      status: "ocr_processing",
      startedAt: extraction.startedAt ?? new Date(),
      failedAt: null,
    },
  });

  try {
    const rawText = await createOcrService().extractText(extraction.betTicketImage.imageUrl);
    await prisma.aIExtraction.updateMany({
      where: { id: extractionId, extractionVersion: extraction.extractionVersion, rawText: null },
      data: {
        rawText,
        provider: getConfiguredOcrProviderName(),
        status: "ai_processing",
      },
    });
  } catch (error) {
    await prisma.aIExtraction.updateMany({
      where: { id: extractionId },
      data: { status: "failed", failedAt: new Date() },
    });
    reportOperationalError("ocr.failed");
    throw error;
  }
  return { extractionId };
}

export async function processTicketAiStep(extractionId: string) {
  "use step";

  const extraction = await prisma.aIExtraction.findUnique({
    where: { id: extractionId },
    include: {
      betTicketImage: {
        select: {
          id: true,
          user: { select: { currency: true, timezone: true } },
        },
      },
    },
  });
  if (!extraction || extraction.extractedData || !extraction.rawText) return { extractionId };

  await prisma.aIExtraction.updateMany({
    where: { id: extractionId, status: { in: ["ai_processing", "failed"] } },
    data: { status: "ai_processing", failedAt: null },
  });

  try {
    const startedAt = Date.now();
    const result = await parseTicketWithProviderRouting(
      extraction.rawText,
      extraction.betTicketImage.id,
      {
        preferredCurrency: extraction.betTicketImage.user.currency,
        timezone: extraction.betTicketImage.user.timezone,
      },
    );
    const requiresReview = result.model === "manual-review" || result.ticket.confidenceScore < TICKET_REVIEW_CONFIDENCE;
    await prisma.aIExtraction.updateMany({
      where: { id: extractionId, extractionVersion: extraction.extractionVersion, extractedData: { equals: Prisma.DbNull } },
      data: {
        provider: `${extraction.provider ?? getConfiguredOcrProviderName()}+${result.provider ?? "unknown"}`,
        model: result.model,
        confidence: new Prisma.Decimal(result.ticket.confidenceScore.toString()),
        extractedData: jsonRecord({
          ...result.ticket,
          requiresReview,
          aiMetadata: {
            model: result.model,
            fallbackUsed: result.fallbackUsed,
          },
        }),
        inputTokens: result.usage?.inputTokens,
        cachedInputTokens: result.usage?.cachedInputTokens,
        outputTokens: result.usage?.outputTokens,
        latencyMs: result.latencyMs ?? Date.now() - startedAt,
        fallbackUsed: result.fallbackUsed,
      },
    });
    reportAiExtractionSpan({
      task: "ticket_extraction",
      provider: result.provider ?? "unknown",
      model: result.model,
      result: result.model === "manual-review" ? "manual_review" : "success",
      fallback: result.fallbackUsed,
      latencyMs: result.latencyMs ?? Date.now() - startedAt,
      inputTokens: result.usage?.inputTokens,
      cachedInputTokens: result.usage?.cachedInputTokens,
      outputTokens: result.usage?.outputTokens,
    });
  } catch (error) {
    await prisma.aIExtraction.updateMany({
      where: { id: extractionId },
      data: { status: "failed", failedAt: new Date() },
    });
    reportOperationalError("ai.failed");
    throw error;
  }
  return { extractionId };
}

export async function finalizeTicketExtractionStep(extractionId: string) {
  "use step";

  const extraction = await prisma.aIExtraction.findUnique({ where: { id: extractionId } });
  if (!extraction || ["ready_for_review", "requires_review", "reviewed_and_confirmed"].includes(extraction.status)) {
    return { extractionId };
  }
  const result = extractedBetTicketSchema.safeParse(extraction.extractedData);
  if (!result.success) {
    await prisma.aIExtraction.updateMany({
      where: { id: extractionId },
      data: { status: "failed", failedAt: new Date() },
    });
    return { extractionId };
  }

  const requiresReview = extraction.model === "manual-review" || result.data.confidenceScore < TICKET_REVIEW_CONFIDENCE;
  await prisma.aIExtraction.updateMany({
    where: { id: extractionId, status: "ai_processing" },
    data: {
      status: requiresReview ? "requires_review" : "ready_for_review",
      completedAt: new Date(),
      failedAt: null,
    },
  });
  return { extractionId };
}
