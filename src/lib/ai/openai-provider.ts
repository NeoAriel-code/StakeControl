import type { AiProvider, AiStructuredResponse } from "@/lib/ai/ai-provider";

type OpenAiResponse = {
  output_text?: string;
  usage?: { total_tokens?: number };
};

type OpenAiErrorResponse = {
  error?: { message?: string };
};

function getRequestTimeoutMs(task: Parameters<AiProvider["generateStructured"]>[0]["task"]) {
  const defaultTimeout = task === "ticket_extraction" ? 8000 : 15000;
  const configuredTimeout = task === "ticket_extraction" ? Number(process.env.AI_TICKET_TIMEOUT_MS) : NaN;

  return Number.isFinite(configuredTimeout) && configuredTimeout >= 1000 && configuredTimeout <= 30000
    ? configuredTimeout
    : defaultTimeout;
}

export class OpenAiProvider implements AiProvider {
  constructor(private readonly apiKey = process.env.OPENAI_API_KEY) {}

  async generateStructured<T>(input: Parameters<AiProvider["generateStructured"]>[0]): Promise<AiStructuredResponse<T>> {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY no está configurada.");
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(getRequestTimeoutMs(input.task)),
      body: JSON.stringify({
        model: input.model,
        instructions: input.system,
        input: input.prompt,
        store: false,
        text: {
          format: {
            type: "json_schema",
            name: input.schemaName,
            strict: true,
            schema: input.jsonSchema,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorPayload = (await response.json().catch(() => null)) as OpenAiErrorResponse | null;
      const detail = errorPayload?.error?.message?.trim();
      throw new Error(
        `OpenAI no pudo procesar la extracción (${response.status})${detail ? `: ${detail}` : "."}`
      );
    }

    const payload = (await response.json()) as OpenAiResponse;
    if (!payload.output_text) {
      throw new Error("OpenAI no devolvió una salida estructurada.");
    }

    return {
      data: JSON.parse(payload.output_text) as T,
      model: input.model,
      estimatedTokens: payload.usage?.total_tokens ?? Math.ceil((input.prompt.length + payload.output_text.length) / 4),
    };
  }
}
