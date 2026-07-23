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
