import * as Sentry from "@sentry/nextjs";

export type OperationalErrorCategory =
  | "auth.login_failed"
  | "ocr.failed"
  | "ai.failed"
  | "bet.persistence_failed"
  | "export.failed"
  | "email.delivery_failed"
  | "timeout";

export function reportOperationalError(category: OperationalErrorCategory, userId?: string) {
  void captureOperationalError(category, userId);
}

type AiExtractionSpan = {
  task: "ticket_extraction" | "behavior_analysis";
  provider: string;
  model: string;
  result: "success" | "manual_review" | "failed";
  fallback: boolean;
  latencyMs: number;
  inputTokens?: number;
  cachedInputTokens?: number;
  outputTokens?: number;
};

export function reportAiExtractionSpan(input: AiExtractionSpan) {
  Sentry.startSpan({
    name: "ai.structured_extraction",
    op: "ai.run",
    attributes: {
      "ai.task": input.task,
      "ai.provider": input.provider,
      "ai.model": input.model,
      "ai.result": input.result,
      "ai.fallback": input.fallback,
      "ai.latency_ms": input.latencyMs,
      "ai.input_tokens": input.inputTokens ?? 0,
      "ai.cached_input_tokens": input.cachedInputTokens ?? 0,
      "ai.output_tokens": input.outputTokens ?? 0,
    },
  }, () => undefined);
}

async function captureOperationalError(category: OperationalErrorCategory, userId?: string) {
  const anonymizeUserId = userId
    ? (await import("@/lib/observability/sentry-user")).anonymizeUserId
    : undefined;

  Sentry.withScope((scope) => {
    scope.setTag("category", category);
    if (userId && anonymizeUserId) scope.setUser({ id: anonymizeUserId(userId) });
    Sentry.captureException(new Error("Operational error"));
  });
}
