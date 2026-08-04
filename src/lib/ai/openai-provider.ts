import type { AiProvider, AiStructuredInput, AiStructuredResponse } from "@/lib/ai/ai-provider";

type OpenAiChatCompletionResponse = {
  id?: string;
  choices?: Array<{
    message?: {
      role?: string;
      content?: string | null;
    };
    finish_reason?: string;
  }>;
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    prompt_tokens_details?: { cached_tokens?: number };
  };
};

type OpenAiErrorResponse = {
  error?: { message?: string; type?: string; code?: string };
};

function getRequestTimeoutMs(task: Parameters<AiProvider["generateStructured"]>[0]["task"], override?: number) {
  if (Number.isFinite(override) && override! >= 1 && override! <= 30000) return override!;
  const defaultTimeout = task === "ticket_extraction" ? 15000 : 25000;
  const configuredTimeout = task === "ticket_extraction" ? Number(process.env.AI_TICKET_TIMEOUT_MS) : NaN;

  return Number.isFinite(configuredTimeout) && configuredTimeout >= 1000 && configuredTimeout <= 30000
    ? configuredTimeout
    : defaultTimeout;
}

export function getStructuredOutputText(payload: OpenAiChatCompletionResponse): string | null {
  if (payload.choices?.[0]?.message?.content?.trim()) {
    return payload.choices[0].message.content;
  }

  if (payload.output_text?.trim()) {
    return payload.output_text;
  }

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text?.trim()) {
        return content.text;
      }
    }
  }

  return null;
}

export class OpenAiProvider implements AiProvider {
  constructor(private readonly apiKey = process.env.OPENAI_API_KEY) {}

  async generateStructured<T>(input: AiStructuredInput<T>): Promise<AiStructuredResponse<T>> {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY no está configurada.");
    }

    const requestBody = {
      model: input.model,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: input.schemaName,
          strict: true,
          schema: input.jsonSchema,
        },
      },
    };

    const startedAt = Date.now();
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(getRequestTimeoutMs(input.task, input.timeoutMs)),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorPayload = (await response.json().catch(() => null)) as OpenAiErrorResponse | null;
      const detail = errorPayload?.error?.message?.trim();
      throw new Error(
        `OpenAI no pudo procesar la extracción (${response.status})${detail ? `: ${detail}` : "."}`
      );
    }

    const payload = (await response.json()) as OpenAiChatCompletionResponse;
    const outputText = getStructuredOutputText(payload);
    if (!outputText) {
      throw new Error("OpenAI no devolvió una salida estructurada.");
    }

    const parsed = JSON.parse(outputText) as unknown;
    const data: T = input.validate ? input.validate(parsed) : (parsed as T);
    const inputTokens = payload.usage?.prompt_tokens ?? 0;
    const outputTokens = payload.usage?.completion_tokens ?? 0;
    return {
      data,
      model: input.model,
      estimatedTokens: payload.usage?.total_tokens ?? Math.ceil((input.prompt.length + outputText.length) / 4),
      usage: {
        inputTokens,
        cachedInputTokens: payload.usage?.prompt_tokens_details?.cached_tokens ?? 0,
        outputTokens,
      },
      latencyMs: Date.now() - startedAt,
      finishReason: payload.choices?.[0]?.finish_reason,
    };
  }
}
