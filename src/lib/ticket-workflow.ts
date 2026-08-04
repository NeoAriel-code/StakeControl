import "server-only";

import { start } from "workflow/api";
import prisma from "@/lib/prisma";
import { processTicketExtractionWorkflow } from "../../workflows/process-ticket-extraction";

export async function enqueueTicketExtraction(extractionId: string) {
  const run = await start(processTicketExtractionWorkflow, [extractionId]);
  await prisma.aIExtraction.updateMany({
    where: { id: extractionId },
    data: { workflowRunId: run.runId, attemptCount: { increment: 1 } },
  });
  return run.runId;
}
