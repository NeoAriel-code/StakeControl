export type AiTask = "ticket_extraction" | "behavior_analysis";

export type AiStructuredResponse<T> = {
  data: T;
  model: string;
  estimatedTokens: number;
};

export interface AiProvider {
  generateStructured<T>(input: {
    task: AiTask;
    model: string;
    system: string;
    prompt: string;
    schemaName: string;
    jsonSchema: Record<string, unknown>;
  }): Promise<AiStructuredResponse<T>>;
}
