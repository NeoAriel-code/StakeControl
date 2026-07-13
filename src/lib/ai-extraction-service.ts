import "server-only";

import type { ExtractedBetTicket } from "@/lib/ticket-extraction";
import { structureMockBetTicket } from "@/lib/mock-ticket-parser";

export interface AiExtractionProvider {
  structureBetTicket(rawText: string): Promise<ExtractedBetTicket>;
}

class MockAiExtractionProvider implements AiExtractionProvider {
  async structureBetTicket(rawText: string): Promise<ExtractedBetTicket> {
    return structureMockBetTicket(rawText);
  }
}

export class AiExtractionService {
  constructor(private readonly provider: AiExtractionProvider) {}

  structureBetTicket(rawText: string) {
    return this.provider.structureBetTicket(rawText);
  }
}

export function createAiExtractionService() {
  return new AiExtractionService(new MockAiExtractionProvider());
}
