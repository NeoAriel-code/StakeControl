import { Prisma, type PrismaClient } from "@prisma/client";
import {
  calculateROI,
  type DashboardMetrics,
} from "@/lib/dashboard-metrics";
import { withDatabaseSpan } from "@/lib/observability/database-spans";
import prisma from "@/lib/prisma";
import { getTrailingMonthBoundsForUserTimezone } from "@/lib/user-time-periods";

type AggregateRow = {
  betCount: number | bigint | null;
  stakeTotal: number | null;
  averageStake: number | null;
  averageOdds: number | null;
  profitLossTotal: number | null;
  resolvedStakeTotal: number | null;
  resolvedBetsCount: number | bigint | null;
  winningBetsCount: number | bigint | null;
};

type ExposureRow = {
  name: string;
  stake: number;
};

type StreakRow = {
  result: "WON" | "LOST" | null;
  streak: number | bigint | null;
};

type MonthlyRow = {
  month: string;
  profitLoss: number | null;
};

export type DashboardRecentBet = {
  id: string;
  title: string;
  placedAt: Date | null;
  result: string;
  sportsbook: string | null;
  currency: string;
  stake: number;
  odds: number;
};

export type DashboardSnapshot = {
  metrics: DashboardMetrics;
  recentBets: DashboardRecentBet[];
  preferredCurrency: string;
};

function round(value: number, decimals = 2) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(decimals));
}

function asNumber(value: number | bigint | null | undefined) {
  return value === null || value === undefined ? 0 : Number(value);
}

const historicalProfitLossSql = Prisma.sql`
  CASE
    WHEN "result" IN ('PENDING', 'UNKNOWN', 'VOID') THEN 0
    WHEN "result" = 'LOST' THEN -ABS(CAST("stake" AS REAL))
    ELSE COALESCE(CAST("profitLoss" AS REAL), 0)
  END
`;

async function loadAggregate(client: PrismaClient, userId: string) {
  const rows = await withDatabaseSpan(
    "dashboard.snapshot.totals",
    "aggregate",
    () => client.$queryRaw<AggregateRow[]>(Prisma.sql`
      SELECT
        COUNT(*) AS "betCount",
        COALESCE(SUM(CAST("stake" AS REAL)), 0) AS "stakeTotal",
        COALESCE(AVG(CAST("stake" AS REAL)), 0) AS "averageStake",
        COALESCE(AVG(CAST("odds" AS REAL)), 0) AS "averageOdds",
        COALESCE(SUM(${historicalProfitLossSql}), 0) AS "profitLossTotal",
        COALESCE(SUM(
          CASE WHEN "result" NOT IN ('PENDING', 'UNKNOWN')
            THEN CAST("stake" AS REAL) ELSE 0 END
        ), 0) AS "resolvedStakeTotal",
        SUM(CASE WHEN "result" NOT IN ('PENDING', 'UNKNOWN') THEN 1 ELSE 0 END) AS "resolvedBetsCount",
        SUM(CASE WHEN "result" = 'WON' THEN 1 ELSE 0 END) AS "winningBetsCount"
      FROM "Bet"
      WHERE "userId" = ${userId}
    `),
    () => 1,
  );

  return rows[0];
}

async function loadRecentBets(client: PrismaClient, userId: string) {
  const rows = await withDatabaseSpan(
    "dashboard.snapshot.recent",
    "select",
    () => client.bet.findMany({
      where: { userId },
      orderBy: { placedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        placedAt: true,
        result: true,
        sportsbook: true,
        currency: true,
        stake: true,
        odds: true,
      },
    }),
    (result) => result.length,
  );

  return rows.map((bet) => ({
    ...bet,
    stake: Number(bet.stake),
    odds: Number(bet.odds),
  }));
}

async function loadExposure(
  client: PrismaClient,
  userId: string,
  column: "sport" | "market",
) {
  const columnSql = column === "sport" ? Prisma.raw('"sport"') : Prisma.raw('"market"');

  return withDatabaseSpan(
    `dashboard.snapshot.${column}-exposure`,
    "aggregate",
    () => client.$queryRaw<ExposureRow[]>(Prisma.sql`
      SELECT
        COALESCE(NULLIF(TRIM(${columnSql}), ''), 'Sin categoría') AS "name",
        SUM(CAST("stake" AS REAL)) AS "stake"
      FROM "Bet"
      WHERE "userId" = ${userId}
      GROUP BY COALESCE(NULLIF(TRIM(${columnSql}), ''), 'Sin categoría')
      ORDER BY "stake" DESC, "name" ASC
      LIMIT 6
    `),
    (result) => result.length,
  );
}

async function loadCurrentStreak(client: PrismaClient, userId: string) {
  const rows = await withDatabaseSpan(
    "dashboard.snapshot.streak",
    "window",
    () => client.$queryRaw<StreakRow[]>(Prisma.sql`
      WITH "ordered" AS (
        SELECT
          "result",
          ROW_NUMBER() OVER (
            ORDER BY "placedAt" DESC, "createdAt" DESC, "id" DESC
          ) AS "position"
        FROM "Bet"
        WHERE
          "userId" = ${userId}
          AND "placedAt" IS NOT NULL
          AND "result" IN ('WON', 'LOST')
      ),
      "current" AS (
        SELECT "result" FROM "ordered" WHERE "position" = 1
      )
      SELECT
        (SELECT "result" FROM "current") AS "result",
        COALESCE(
          (
            SELECT MIN("ordered"."position") - 1
            FROM "ordered", "current"
            WHERE "ordered"."result" <> "current"."result"
          ),
          (SELECT COUNT(*) FROM "ordered")
        ) AS "streak"
    `),
    () => 1,
  );

  return rows[0];
}

async function loadMonthlyProfitLoss(
  client: PrismaClient,
  userId: string,
  timezone: string,
  referenceDate: Date,
) {
  const months = getTrailingMonthBoundsForUserTimezone(referenceDate, timezone, 12);
  const monthValues = Prisma.join(
    months.map((month, position) =>
      Prisma.sql`(${month.month}, ${month.start}, ${month.end}, ${position})`
    ),
  );

  return withDatabaseSpan(
    "dashboard.snapshot.monthly",
    "aggregate",
    () => client.$queryRaw<MonthlyRow[]>(Prisma.sql`
      WITH "months" ("month", "startAt", "endAt", "position") AS (
        VALUES ${monthValues}
      )
      SELECT
        "months"."month" AS "month",
        COALESCE(SUM(${historicalProfitLossSql}), 0) AS "profitLoss"
      FROM "months"
      INNER JOIN "Bet"
        ON "Bet"."userId" = ${userId}
        AND "Bet"."placedAt" >= "months"."startAt"
        AND "Bet"."placedAt" < "months"."endAt"
      GROUP BY "months"."month", "months"."position"
      ORDER BY "months"."position" ASC
    `),
    (result) => result.length,
  );
}

export async function loadDashboardSnapshot(
  client: PrismaClient,
  userId: string,
  timezone = "UTC",
  fallbackCurrency = "USD",
  referenceDate = new Date(),
): Promise<DashboardSnapshot> {
  const [aggregate, recentBets, sportRows, marketRows, streak, monthlyRows] = await Promise.all([
    loadAggregate(client, userId),
    loadRecentBets(client, userId),
    loadExposure(client, userId, "sport"),
    loadExposure(client, userId, "market"),
    loadCurrentStreak(client, userId),
    loadMonthlyProfitLoss(client, userId, timezone, referenceDate),
  ]);

  const rawStakeTotal = asNumber(aggregate?.stakeTotal);
  const stakeTotal = round(rawStakeTotal);
  const profitLossTotal = round(asNumber(aggregate?.profitLossTotal));
  const resolvedStakeTotal = round(asNumber(aggregate?.resolvedStakeTotal));
  const resolvedBetsCount = asNumber(aggregate?.resolvedBetsCount);
  const winningBetsCount = asNumber(aggregate?.winningBetsCount);
  const exposure = (rows: ExposureRow[]) => rows.map((row) => ({
    name: row.name,
    stake: round(asNumber(row.stake)),
    exposurePct: round(rawStakeTotal ? asNumber(row.stake) / rawStakeTotal * 100 : 0),
  }));
  const currentStreak = asNumber(streak?.streak);

  return {
    metrics: {
      profitLossTotal,
      stakeTotal,
      roiHistorical: calculateROI(profitLossTotal, resolvedStakeTotal),
      winRate: round(resolvedBetsCount ? winningBetsCount / resolvedBetsCount * 100 : 0),
      averageStake: round(asNumber(aggregate?.averageStake)),
      averageOdds: round(asNumber(aggregate?.averageOdds)),
      betCount: asNumber(aggregate?.betCount),
      currentWinningStreak: streak?.result === "WON" ? currentStreak : 0,
      currentLosingStreak: streak?.result === "LOST" ? currentStreak : 0,
      monthlyProfitLoss: monthlyRows.map((row) => ({
        month: row.month,
        profitLoss: round(asNumber(row.profitLoss)),
      })),
      sportExposure: exposure(sportRows),
      marketExposure: exposure(marketRows),
      resolvedBetsCount,
      winningBetsCount,
    },
    recentBets,
    preferredCurrency: recentBets[0]?.currency ?? fallbackCurrency,
  };
}

export function getDashboardSnapshot(
  userId: string,
  timezone = "UTC",
  fallbackCurrency = "USD",
  referenceDate = new Date(),
) {
  return loadDashboardSnapshot(prisma, userId, timezone, fallbackCurrency, referenceDate);
}
