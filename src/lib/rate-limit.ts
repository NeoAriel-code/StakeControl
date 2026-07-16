import "server-only";
import prisma from "@/lib/prisma";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

export async function checkRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const current = await prisma.rateLimitBucket.findUnique({ where: { key } });

  if (!current || current.resetAt.getTime() <= now) {
    const resetAt = new Date(now + windowMs);
    await prisma.rateLimitBucket.upsert({ where: { key }, create: { key, count: 1, resetAt }, update: { count: 1, resetAt } });
    return { allowed: true, remaining: Math.max(limit - 1, 0), resetAt: resetAt.getTime() };
  }
  if (current.count >= limit) return { allowed: false, remaining: 0, resetAt: current.resetAt.getTime() };
  const updated = await prisma.rateLimitBucket.update({ where: { key }, data: { count: { increment: 1 } } });
  return { allowed: true, remaining: Math.max(limit - updated.count, 0), resetAt: updated.resetAt.getTime() };
}

export function formatRateLimitMessage(resetAt: number) {
  const seconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return `Demasiados intentos. Vuelve a probar en ${seconds} segundo${seconds === 1 ? "" : "s"}.`;
}
