import "server-only";
import prisma from "@/lib/prisma";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

export async function checkRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const nowDate = new Date(now);
  const resetAt = new Date(now + windowMs);

  const incremented = await prisma.rateLimitBucket.updateMany({
    where: { key, resetAt: { gt: nowDate }, count: { lt: limit } },
    data: { count: { increment: 1 } },
  });

  if (incremented.count === 1) {
    const bucket = await prisma.rateLimitBucket.findUniqueOrThrow({ where: { key } });
    return { allowed: true, remaining: Math.max(limit - bucket.count, 0), resetAt: bucket.resetAt.getTime() };
  }

  const reset = await prisma.rateLimitBucket.updateMany({
    where: { key, resetAt: { lte: nowDate } },
    data: { count: 1, resetAt },
  });

  if (reset.count === 1) {
    return { allowed: true, remaining: Math.max(limit - 1, 0), resetAt: resetAt.getTime() };
  }

  try {
    await prisma.rateLimitBucket.create({ data: { key, count: 1, resetAt } });
    return { allowed: true, remaining: Math.max(limit - 1, 0), resetAt: resetAt.getTime() };
  } catch {
    const retriedIncrement = await prisma.rateLimitBucket.updateMany({
      where: { key, resetAt: { gt: nowDate }, count: { lt: limit } },
      data: { count: { increment: 1 } },
    });

    if (retriedIncrement.count === 1) {
      const bucket = await prisma.rateLimitBucket.findUniqueOrThrow({ where: { key } });
      return { allowed: true, remaining: Math.max(limit - bucket.count, 0), resetAt: bucket.resetAt.getTime() };
    }

    const current = await prisma.rateLimitBucket.findUniqueOrThrow({ where: { key } });
    return { allowed: false, remaining: 0, resetAt: current.resetAt.getTime() };
  }
}

export function formatRateLimitMessage(resetAt: number) {
  const seconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return `Demasiados intentos. Vuelve a probar en ${seconds} segundo${seconds === 1 ? "" : "s"}.`;
}
