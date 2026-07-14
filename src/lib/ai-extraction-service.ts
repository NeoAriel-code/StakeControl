import "server-only";

import {
  parseTicketWithRouting,
  type TicketExtractionContext,
  type TicketRoutingResult,
} from "@/lib/ai/ticket-parser";

export interface AiExtractionProvider {
  structureBetTicket(rawText: string, context?: TicketExtractionContext): Promise<TicketRoutingResult>;
}

export class AiExtractionService {
  constructor(private readonly provider: AiExtractionProvider) {}

  structureBetTicket(rawText: string, context?: TicketExtractionContext): Promise<TicketRoutingResult> {
    return this.provider.structureBetTicket(rawText, context);
  }
}

export function createAiExtractionService() {
  return new AiExtractionService({
    structureBetTicket(rawText, context) {
      return parseTicketWithRouting(rawText, undefined, context);
    },
  });
}
