export type AiTask = "ticket_extraction" | "behavior_analysis";

export type AiStructuredResponse<T> = {
  data: T;
  model: string;
  estimatedTokens: number;
  usage?: {
    inputTokens: number;
    cachedInputTokens: number;
    outputTokens: number;
  };
  latencyMs?: number;
  finishReason?: string;
};

export type AiStructuredInput<T> = {
    task: AiTask;
    model: string;
    system: string;
    prompt: string;
    schemaName: string;
    jsonSchema: Record<string, unknown>;
    timeoutMs?: number;
    validate?: (value: unknown) => T;
};

export interface AiProvider {
  generateStructured<T>(input: AiStructuredInput<T>): Promise<AiStructuredResponse<T>>;
}
