import { processTicketAiStep, processTicketOcrStep, finalizeTicketExtractionStep } from "./steps/ticket-extraction-steps";

export async function processTicketExtractionWorkflow(extractionId: string) {
  "use workflow";

  await processTicketOcrStep(extractionId);
  await processTicketAiStep(extractionId);
  await finalizeTicketExtractionStep(extractionId);

  return { extractionId };
}
