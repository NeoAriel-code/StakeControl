import "server-only";

import { AlertSeverity, AlertType, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { canUseFeature } from "@/lib/plans";
import {
  detectLossStreak,
  detectStakeIncrease,
  evaluateLimits,
  isPauseActiveAt,
  type LimitStatus,
} from "@/lib/responsible-gaming-rules";
import {
  getMonthBoundsForUserTimezone,
  getPeriodStartsForUserTimezone,
} from "@/lib/user-time-periods";

export type { LimitStatus } from "@/lib/responsible-gaming-rules";

export type LimitTotals = {
  dailyStake: number;
  weeklyStake: number;
  monthlyStake: number;
};

function decimalToNumber(value: Prisma.Decimal | null | undefined) {
  return value ? Number(value) : 0;
}

export function isPauseActive(pauseUntil: Date | null | undefined) {
  return isPauseActiveAt(pauseUntil);
}

export function formatPauseMessage(pauseUntil: Date) {
  const formattedDate = new Intl.DateTimeFormat("es-CL", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(pauseUntil);

  return `Tu pausa voluntaria está activa hasta ${formattedDate}. Durante este período no podrás registrar nuevas apuestas.`;
}

export function getPeriodStarts(referenceDate = new Date(), timezone = "UTC") {
  return getPeriodStartsForUserTimezone(referenceDate, timezone);
}

export function getLimitStatus({
  currentValue,
  limitValue,
  pauseUntil,
}: {
  currentValue: number;
  limitValue?: number | null;
  pauseUntil?: Date | null;
}): LimitStatus {
  return evaluateLimits({ currentValue, limitValue, pauseUntil });
}

export async function getCurrentStakeTotals(userId: string, referenceDate = new Date()): Promise<LimitTotals> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
  const { dailyStart, weeklyStart, monthlyStart } = getPeriodStarts(referenceDate, user?.timezone || "UTC");

  const [daily, weekly, monthly] = await Promise.all([
    prisma.bet.aggregate({
      where: {
        userId,
        placedAt: { gte: dailyStart, lte: referenceDate },
      },
      _sum: { stake: true },
    }),
    prisma.bet.aggregate({
      where: {
        userId,
        placedAt: { gte: weeklyStart, lte: referenceDate },
      },
      _sum: { stake: true },
    }),
    prisma.bet.aggregate({
      where: {
        userId,
        placedAt: { gte: monthlyStart, lte: referenceDate },
      },
      _sum: { stake: true },
    }),
  ]);

  return {
    dailyStake: decimalToNumber(daily._sum.stake),
    weeklyStake: decimalToNumber(weekly._sum.stake),
    monthlyStake: decimalToNumber(monthly._sum.stake),
  };
}

export async function getMonthlyStakeTotalForDate(
  userId: string,
  placedAt: Date,
  options?: { excludeBetId?: string }
) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
  const { start: monthlyStart, end: nextMonthStart } = getMonthBoundsForUserTimezone(
    placedAt,
    user?.timezone || "UTC"
  );

  const aggregate = await prisma.bet.aggregate({
    where: {
      userId,
      placedAt: {
        gte: monthlyStart,
        lt: nextMonthStart,
      },
      ...(options?.excludeBetId
        ? {
            id: {
              not: options.excludeBetId,
            },
          }
        : {}),
    },
    _sum: { stake: true },
  });

  return decimalToNumber(aggregate._sum.stake);
}

async function ensureAlertForWindow({
  userId,
  type,
  severity,
  title,
  message,
  metadata,
  createdAfter,
  dedupeKey,
}: {
  userId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
  createdAfter: Date;
  dedupeKey?: string;
}) {
  const existingAlerts = await prisma.responsibleGamingAlert.findMany({
    where: {
      userId,
      type,
      createdAt: { gte: createdAfter },
    },
    orderBy: { createdAt: "desc" },
  });

  const existingAlert = existingAlerts.find((alert) => {
    if (!dedupeKey) {
      return alert.title === title;
    }

    const alertMetadata =
      alert.metadata && typeof alert.metadata === "object" && !Array.isArray(alert.metadata)
        ? (alert.metadata as Record<string, unknown>)
        : null;

    return alertMetadata?.dedupeKey === dedupeKey;
  });

  if (existingAlert) {
    return existingAlert;
  }

  return prisma.responsibleGamingAlert.create({
    data: {
      userId,
      type,
      severity,
      title,
      message,
      metadata:
        metadata && typeof metadata === "object" && !Array.isArray(metadata)
          ? { ...metadata, dedupeKey }
          : metadata,
    },
  });
}

async function ensureLimitAlert({
  userId,
  period,
  currentValue,
  limitValue,
  referenceDate,
  timezone = "UTC",
}: {
  userId: string;
  period: "daily" | "weekly" | "monthly";
  currentValue: number;
  limitValue?: number | null;
  referenceDate: Date;
  timezone?: string;
}) {
  if (!limitValue || limitValue <= 0) {
    return;
  }

  const { dailyStart, weeklyStart, monthlyStart } = getPeriodStarts(referenceDate, timezone);
  const createdAfter =
    period === "daily" ? dailyStart : period === "weekly" ? weeklyStart : monthlyStart;
  const usageRatio = currentValue / limitValue;
  const periodLabel = period === "daily" ? "diario" : period === "weekly" ? "semanal" : "mensual";

  if (usageRatio >= 1) {
    await ensureAlertForWindow({
      userId,
      type: AlertType.LIMIT_EXCEEDED,
      severity: AlertSeverity.HIGH,
      title: `Límite ${periodLabel} superado`,
      message:
        period === "monthly"
          ? "Superaste tu límite mensual. Considera revisar tu presupuesto antes de registrar nuevas apuestas."
          : `Superaste tu límite ${periodLabel}. Puede ser un buen momento para revisar tus límites o activar una pausa breve.`,
      metadata: {
        period,
        limitValue,
        currentValue,
        usageRatio,
        referenceDate: referenceDate.toISOString(),
      },
      createdAfter,
      dedupeKey: `${period}-exceeded-${createdAfter.toISOString()}`,
    });
    return;
  }

  if (usageRatio >= 0.8) {
    await ensureAlertForWindow({
      userId,
      type: AlertType.LIMIT_APPROACHING,
      severity: AlertSeverity.MEDIUM,
      title: `Límite ${periodLabel} cerca de alcanzarse`,
      message:
        period === "monthly"
          ? "Estás cerca de tu límite mensual. Considera revisar tu presupuesto antes de registrar nuevas apuestas."
          : `Estás cerca de tu límite ${periodLabel}. Puede ayudarte revisar tu presupuesto antes de registrar nuevas apuestas.`,
      metadata: {
        period,
        limitValue,
        currentValue,
        usageRatio,
        referenceDate: referenceDate.toISOString(),
      },
      createdAfter,
      dedupeKey: `${period}-approaching-${createdAfter.toISOString()}`,
    });
  }
}

export async function evaluateResponsibleGamingAlerts(userId: string) {
  const now = new Date();
  const canUseIntelligentAlerts = await canUseFeature(userId, "alerts_intelligent");
  const [limits, totals, bets, user] = await Promise.all([
    prisma.userLimits.findUnique({
      where: { userId },
    }),
    getCurrentStakeTotals(userId, now),
    prisma.bet.findMany({
      where: { userId },
      orderBy: { placedAt: "desc" },
      take: 100,
      select: {
        id: true,
        stake: true,
        result: true,
        placedAt: true,
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
  ]);

  await Promise.all([
    ensureLimitAlert({
      userId,
      period: "daily",
      currentValue: totals.dailyStake,
      limitValue: limits?.dailyStakeLimit ? Number(limits.dailyStakeLimit) : null,
      referenceDate: now,
      timezone: user?.timezone,
    }),
    ensureLimitAlert({
      userId,
      period: "weekly",
      currentValue: totals.weeklyStake,
      limitValue: limits?.weeklyStakeLimit ? Number(limits.weeklyStakeLimit) : null,
      referenceDate: now,
      timezone: user?.timezone,
    }),
    ensureLimitAlert({
      userId,
      period: "monthly",
      currentValue: totals.monthlyStake,
      limitValue: limits?.monthlyStakeLimit ? Number(limits.monthlyStakeLimit) : null,
      referenceDate: now,
      timezone: user?.timezone,
    }),
  ]);

  if (!canUseIntelligentAlerts) {
    return;
  }

  const stakeValues = bets.map((bet) => Number(bet.stake));
  const stakeIncrease = detectStakeIncrease(stakeValues);
  const { recentAverageStake, historicalAverageStake } = stakeIncrease;
  const stakeIncreaseTriggered = stakeIncrease.triggered;

  if (stakeIncreaseTriggered) {
    await ensureAlertForWindow({
      userId,
      type: AlertType.STAKE_INCREASE,
      severity: AlertSeverity.MEDIUM,
      title: "Aumento reciente del stake",
      message:
        "Tus últimas apuestas muestran un stake promedio superior a tu promedio histórico. Puede ser útil revisar tus límites antes de seguir registrando actividad.",
      metadata: {
        recentAverageStake,
        historicalAverageStake,
        recentBetsConsidered: stakeIncrease.recentBetsConsidered,
      },
      createdAfter: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      dedupeKey: "stake-increase-24h",
    });
  }

  const lossStreak = detectLossStreak(bets.map((bet) => bet.result));
  const lossStreakCount = lossStreak.count;
  const lossStreakTriggered = lossStreak.triggered;

  if (lossStreakTriggered) {
    await ensureAlertForWindow({
      userId,
      type: AlertType.LOSS_STREAK,
      severity: AlertSeverity.HIGH,
      title: "Racha reciente de pérdidas",
      message:
        "Se registró una racha reciente de pérdidas consecutivas. Considera revisar tus límites o tomarte una pausa antes de continuar.",
      metadata: {
        lossStreakCount,
      },
      createdAfter: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      dedupeKey: "loss-streak-24h",
    });
  }

  const last24HoursStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const betsInLast24Hours = bets.filter((bet) => bet.placedAt !== null && bet.placedAt >= last24HoursStart).length;
  const highFrequencyTriggered = betsInLast24Hours > 10;

  if (highFrequencyTriggered) {
    await ensureAlertForWindow({
      userId,
      type: AlertType.HIGH_FREQUENCY,
      severity: AlertSeverity.MEDIUM,
      title: "Frecuencia alta de registros",
      message:
        "Registraste más de 10 apuestas en 24 horas. Puede ayudarte revisar tus límites o tomarte un momento antes de seguir agregando actividad.",
      metadata: {
        betsInLast24Hours,
      },
      createdAfter: last24HoursStart,
      dedupeKey: "high-frequency-24h",
    });
  }

  if (lossStreakTriggered && stakeIncreaseTriggered) {
    await ensureAlertForWindow({
      userId,
      type: AlertType.PAUSE_RECOMMENDED,
      severity: AlertSeverity.HIGH,
      title: "Pausa sugerida",
      message:
        "Se observa una combinación de pérdidas consecutivas y aumento reciente del stake. Puede ser un buen momento para activar una pausa voluntaria o revisar tus límites.",
      metadata: {
        lossStreakCount,
        recentAverageStake,
        historicalAverageStake,
      },
      createdAfter: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      dedupeKey: "pause-recommended-24h",
    });
  }
}

export async function ensureMonthlyLimitAlerts({
  userId,
  monthlyLimit,
  monthlyStakeTotal,
  referenceDate,
  timezone,
}: {
  userId: string;
  monthlyLimit?: number | null;
  monthlyStakeTotal: number;
  referenceDate: Date;
  timezone?: string;
}) {
  await ensureLimitAlert({
    userId,
    period: "monthly",
    currentValue: monthlyStakeTotal,
    limitValue: monthlyLimit,
    referenceDate,
    timezone,
  });
}
