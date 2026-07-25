import type { AiProvider, AiStructuredResponse } from "@/lib/ai/ai-provider";

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
  usage?: { total_tokens?: number };
};

type OpenAiErrorResponse = {
  error?: { message?: string; type?: string; code?: string };
};

function getRequestTimeoutMs(task: Parameters<AiProvider["generateStructured"]>[0]["task"]) {
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

  async generateStructured<T>(input: Parameters<AiProvider["generateStructured"]>[0]): Promise<AiStructuredResponse<T>> {
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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(getRequestTimeoutMs(input.task)),
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

    return {
      data: JSON.parse(outputText) as T,
      model: input.model,
      estimatedTokens: payload.usage?.total_tokens ?? Math.ceil((input.prompt.length + outputText.length) / 4),
    };
  }
}
