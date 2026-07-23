import { assertProductionEmailConfiguration } from "@/lib/email/email-config";
import { registerSentry } from "@/lib/observability/sentry-register";
import * as Sentry from "@sentry/nextjs";

export async function register() {
  assertProductionEmailConfiguration();
  await registerSentry();
}

export const onRequestError = Sentry.captureRequestError;
