import "server-only";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret-config";
import { hmacRateLimitKey, resolveTrustedClientIp } from "@/lib/rate-limit-identifiers";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type PublicRateLimitOptions = Omit<RateLimitOptions, "key"> & {
  scope: string;
  accountIdentifier: string;
};

export function anonymizeRateLimitKey(key: string, secret = getAuthSecret()) {
  return hmacRateLimitKey(key, secret);
}

export function getTrustedClientIp(
  requestHeaders: Pick<Headers, "get">,
  environment: Record<string, string | undefined> = process.env,
) {
  return resolveTrustedClientIp(requestHeaders, environment);
}

export async function checkRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const anonymizedKey = anonymizeRateLimitKey(key);
  const now = Date.now();
  const nowDate = new Date(now);
  const resetAt = new Date(now + windowMs);

  const incremented = await prisma.rateLimitBucket.updateMany({
    where: { key: anonymizedKey, resetAt: { gt: nowDate }, count: { lt: limit } },
    data: { count: { increment: 1 } },
  });

  if (incremented.count === 1) {
    const bucket = await prisma.rateLimitBucket.findUniqueOrThrow({ where: { key: anonymizedKey } });
    return { allowed: true, remaining: Math.max(limit - bucket.count, 0), resetAt: bucket.resetAt.getTime() };
  }

  const reset = await prisma.rateLimitBucket.updateMany({
    where: { key: anonymizedKey, resetAt: { lte: nowDate } },
    data: { count: 1, resetAt },
  });

  if (reset.count === 1) {
    return { allowed: true, remaining: Math.max(limit - 1, 0), resetAt: resetAt.getTime() };
  }

  try {
    await prisma.rateLimitBucket.create({ data: { key: anonymizedKey, count: 1, resetAt } });
    return { allowed: true, remaining: Math.max(limit - 1, 0), resetAt: resetAt.getTime() };
  } catch {
    const retriedIncrement = await prisma.rateLimitBucket.updateMany({
      where: { key: anonymizedKey, resetAt: { gt: nowDate }, count: { lt: limit } },
      data: { count: { increment: 1 } },
    });

    if (retriedIncrement.count === 1) {
      const bucket = await prisma.rateLimitBucket.findUniqueOrThrow({ where: { key: anonymizedKey } });
      return { allowed: true, remaining: Math.max(limit - bucket.count, 0), resetAt: bucket.resetAt.getTime() };
    }

    const current = await prisma.rateLimitBucket.findUniqueOrThrow({ where: { key: anonymizedKey } });
    return { allowed: false, remaining: 0, resetAt: current.resetAt.getTime() };
  }
}

export async function checkPublicRateLimit({
  scope,
  accountIdentifier,
  limit,
  windowMs,
}: PublicRateLimitOptions) {
  const requestHeaders = await headers();
  const clientIp = getTrustedClientIp(requestHeaders);
  const [ipResult, accountResult] = await Promise.all([
    checkRateLimit({ key: `${scope}:ip:${clientIp}`, limit, windowMs }),
    checkRateLimit({ key: `${scope}:account:${accountIdentifier.trim().toLowerCase()}`, limit, windowMs }),
  ]);

  if (!ipResult.allowed || !accountResult.allowed) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: Math.max(ipResult.resetAt, accountResult.resetAt),
    };
  }

  return {
    allowed: true,
    remaining: Math.min(ipResult.remaining, accountResult.remaining),
    resetAt: Math.max(ipResult.resetAt, accountResult.resetAt),
  };
}

export async function cleanupExpiredRateLimitBuckets(referenceDate = new Date()) {
  return prisma.rateLimitBucket.deleteMany({ where: { resetAt: { lte: referenceDate } } });
}

export function formatRateLimitMessage(resetAt: number) {
  const seconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return `Demasiados intentos. Vuelve a probar en ${seconds} segundo${seconds === 1 ? "" : "s"}.`;
}
