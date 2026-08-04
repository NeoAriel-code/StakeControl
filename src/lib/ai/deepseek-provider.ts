import type { AiProvider, AiStructuredInput, AiStructuredResponse } from "@/lib/ai/ai-provider";

type DeepSeekResponse = {
  choices?: Array<{
    message?: { content?: string | null };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    prompt_cache_hit_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

export type DeepSeekErrorKind =
  | "timeout"
  | "rate_limit"
  | "server"
  | "empty_output"
  | "invalid_json"
  | "truncated"
  | "configuration"
  | "request";

export class DeepSeekProviderError extends Error {
  constructor(
    public readonly kind: DeepSeekErrorKind,
    public readonly status?: number,
    options?: { cause?: unknown },
  ) {
    super(`DeepSeek ticket extraction failed: ${kind}.`, options);
    this.name = "DeepSeekProviderError";
  }

  get retryable() {
    return ["timeout", "rate_limit", "server", "empty_output", "invalid_json", "truncated"].includes(this.kind);
  }

  get opensCircuitImmediately() {
    return this.status === 401 || this.status === 402;
  }
}

export function getDeepSeekTimeoutMs(environment: Record<string, string | undefined> = process.env) {
  const value = Number(environment.AI_TICKET_DEEPSEEK_TIMEOUT_MS);
  return Number.isFinite(value) && value >= 1000 && value <= 20_000 ? value : 9_000;
}

function errorForStatus(status: number) {
  if (status === 429) return new DeepSeekProviderError("rate_limit", status);
  if (status === 500 || status === 503) return new DeepSeekProviderError("server", status);
  if ([400, 401, 402, 422].includes(status)) {
    return new DeepSeekProviderError(status === 401 || status === 402 ? "configuration" : "request", status);
  }
  return new DeepSeekProviderError("request", status);
}

export class DeepSeekProvider implements AiProvider {
  constructor(
    private readonly apiKey = process.env.DEEPSEEK_API_KEY,
    private readonly environment: Record<string, string | undefined> = process.env,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async generateStructured<T>(input: AiStructuredInput<T>): Promise<AiStructuredResponse<T>> {
    if (input.task !== "ticket_extraction") {
      throw new DeepSeekProviderError("request", 400);
    }
    if (!this.apiKey) {
      throw new DeepSeekProviderError("configuration", 401);
    }

    const timeoutMs = Math.min(input.timeoutMs ?? getDeepSeekTimeoutMs(this.environment), 20_000);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = Date.now();

    try {
      const response = await this.fetchImpl("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "deepseek-v4-flash",
          messages: [
            { role: "system", content: input.system },
            { role: "user", content: input.prompt },
          ],
          thinking: { type: "disabled" },
          response_format: { type: "json_object" },
          temperature: 0,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) throw errorForStatus(response.status);

      const payload = await response.json() as DeepSeekResponse;
      const finishReason = payload.choices?.[0]?.finish_reason ?? undefined;
      if (finishReason === "length") throw new DeepSeekProviderError("truncated");
      const outputText = payload.choices?.[0]?.message?.content?.trim();
      if (!outputText) throw new DeepSeekProviderError("empty_output");

      let parsed: unknown;
      try {
        parsed = JSON.parse(outputText);
      } catch (cause) {
        throw new DeepSeekProviderError("invalid_json", undefined, { cause });
      }

      let data: T;
      try {
        data = input.validate ? input.validate(parsed) : (parsed as T);
      } catch (cause) {
        throw new DeepSeekProviderError("invalid_json", undefined, { cause });
      }

      const inputTokens = payload.usage?.prompt_tokens ?? 0;
      const outputTokens = payload.usage?.completion_tokens ?? 0;
      return {
        data,
        model: "deepseek-v4-flash",
        estimatedTokens: payload.usage?.total_tokens ?? inputTokens + outputTokens,
        usage: {
          inputTokens,
          cachedInputTokens: payload.usage?.prompt_cache_hit_tokens ?? 0,
          outputTokens,
        },
        latencyMs: Date.now() - startedAt,
        finishReason,
      };
    } catch (error) {
      if (error instanceof DeepSeekProviderError) throw error;
      if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) {
        throw new DeepSeekProviderError("timeout", undefined, { cause: error });
      }
      throw new DeepSeekProviderError("request", undefined, { cause: error });
    } finally {
      clearTimeout(timer);
    }
  }
}
