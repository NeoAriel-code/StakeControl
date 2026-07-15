export function getAuthSecret(
  environment: Record<string, string | undefined> = process.env
): string {
  const secret = environment.AUTH_SECRET?.trim();

  if (!secret) {
    throw new Error("AUTH_SECRET must be configured.");
  }

  return secret;
}
