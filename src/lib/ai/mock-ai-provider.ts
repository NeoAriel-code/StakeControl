import type { AiProvider, AiStructuredResponse } from "@/lib/ai/ai-provider";

/** A test/local provider. Task-specific callers supply deterministic mock data. */
export class MockAiProvider implements AiProvider {
  async generateStructured<T>(input: Parameters<AiProvider["generateStructured"]>[0]): Promise<AiStructuredResponse<T>> {
    throw new Error(`MockAiProvider requires task data for ${input.task}.`);
  }
}
