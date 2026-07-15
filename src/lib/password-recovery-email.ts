type EmailEnvironment = Record<string, string | undefined>;

export function isPasswordRecoveryEmailConfigured(environment: EmailEnvironment = process.env) {
  return environment.EMAIL_PROVIDER === "resend" && Boolean(environment.RESEND_API_KEY);
}
