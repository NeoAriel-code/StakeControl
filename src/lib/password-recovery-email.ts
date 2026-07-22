import { getEmailConfiguration } from "@/lib/email/email-config";

type EmailEnvironment = Record<string, string | undefined>;

export function isPasswordRecoveryEmailConfigured(environment: EmailEnvironment = process.env) {
  return Boolean(getEmailConfiguration(environment));
}
