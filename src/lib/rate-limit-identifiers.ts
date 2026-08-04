import { createHmac } from "node:crypto";

export function hmacRateLimitKey(key: string, secret: string) {
  return createHmac("sha256", secret).update(`rate-limit:v1:${key}`).digest("hex");
}

export function resolveTrustedClientIp(
  requestHeaders: Pick<Headers, "get">,
  environment: Record<string, string | undefined>,
) {
  const vercelIp = requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercelIp) return vercelIp;

  if (environment.TRUST_CLOUDFLARE_PROXY === "true") {
    const cloudflareIp = requestHeaders.get("cf-connecting-ip")?.trim();
    if (cloudflareIp) return cloudflareIp;
  }

  if (environment.VERCEL) {
    const forwardedIp = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwardedIp) return forwardedIp;
  }

  return requestHeaders.get("x-real-ip")?.trim() || "unknown";
}
