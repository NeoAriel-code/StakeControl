export function getAuthSecret(
  environment: Record<string, string | undefined> = process.env
): string {
  const secret = environment.AUTH_SECRET?.trim();

  if (!secret) {
    throw new Error("AUTH_SECRET must be configured.");
  }

  if (environment.NODE_ENV === "production" && secret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters in production.");
  }

  return secret;
}
