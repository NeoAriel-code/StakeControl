import "server-only";

import { parseTicketWithRouting, type TicketRoutingResult } from "@/lib/ai/ticket-parser";

export interface AiExtractionProvider {
  structureBetTicket(rawText: string): Promise<TicketRoutingResult>;
}

export class AiExtractionService {
  constructor(private readonly provider: AiExtractionProvider) {}

  structureBetTicket(rawText: string): Promise<TicketRoutingResult> {
    return this.provider.structureBetTicket(rawText);
  }
}

export function createAiExtractionService() {
  return new AiExtractionService({ structureBetTicket: parseTicketWithRouting });
}
