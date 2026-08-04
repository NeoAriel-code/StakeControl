import { assertProductionEmailConfiguration } from "@/lib/email/email-config";
import { assertProductionDatabaseConfiguration } from "@/lib/database-config";
import { registerSentry } from "@/lib/observability/sentry-register";
import * as Sentry from "@sentry/nextjs";
import { assertProductionAiConfiguration } from "@/lib/ai/ai-config";

export async function register() {
  assertProductionDatabaseConfiguration();
  assertProductionEmailConfiguration();
  assertProductionAiConfiguration();
  if (process.env.VERCEL_ENV === "production") {
    const { assertEnabledAiProviderKeys } = await import("@/lib/ai/ai-provider-control");
    await assertEnabledAiProviderKeys();
  }
  await registerSentry();
}

export const onRequestError = Sentry.captureRequestError;
