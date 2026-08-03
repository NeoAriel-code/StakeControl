import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { calculateDashboardMetrics, type MetricBet } from "../src/lib/dashboard-metrics";

type TestBet = MetricBet & {
  currency?: string;
  sportsbook?: string | null;
  createdAt?: Date;
};

test("DashboardSnapshot preserves historical metrics while limiting monthly evolution to 12 local months", async () => {
  const directory = await mkdtemp(join(tmpdir(), "stakecontrol-snapshot-"));
  const databasePath = join(directory, "snapshot.db");
  const sqlite = new Database(databasePath);
  sqlite.exec(`
    CREATE TABLE "Bet" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "sportsbook" TEXT,
      "sport" TEXT,
      "market" TEXT,
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "result" TEXT NOT NULL,
      "stake" DECIMAL NOT NULL,
      "odds" DECIMAL NOT NULL,
      "profitLoss" DECIMAL,
      "placedAt" DATETIME,
      "createdAt" DATETIME NOT NULL
    );
    CREATE INDEX "Bet_userId_result_placedAt_idx"
      ON "Bet"("userId", "result", "placedAt" DESC);
  `);

  const bets: TestBet[] = [
    {
      id: "old-cashout",
      title: "Old cashout",
      sport: null,
      market: null,
      result: "CASHOUT",
      stake: 30,
      odds: 2,
      profitLoss: 5,
      placedAt: new Date("2025-08-15T12:00:00.000Z"),
    },
    {
      id: "void",
      title: "Void",
      sport: " Tennis ",
      market: "Moneyline",
      result: "VOID",
      stake: 25,
      odds: 1.7,
      profitLoss: 100,
      placedAt: new Date("2026-05-20T12:00:00.000Z"),
    },
    {
      id: "pending",
      title: "Pending",
      sport: "Football",
      market: "1X2",
      result: "PENDING",
      stake: 40,
      odds: 3.1,
      profitLoss: 999,
      placedAt: new Date("2026-06-15T12:00:00.000Z"),
    },
    {
      id: "timezone-boundary",
      title: "Timezone boundary",
      sport: "Football",
      market: "1X2",
      result: "LOST",
      stake: 12,
      odds: 1.8,
      profitLoss: 999,
      placedAt: new Date("2026-07-01T02:30:00.000Z"),
    },
    ...Array.from({ length: 20 }, (_, index): TestBet => ({
      id: `win-${index}`,
      title: `Win ${index}`,
      sport: index % 2 ? "Football" : "",
      market: index % 2 ? "1X2" : null,
      result: "WON",
      stake: 10 + index,
      odds: 2,
      profitLoss: 10 + index,
      placedAt: new Date(Date.UTC(2026, 6, 10 + index, 12)),
      currency: "CLP",
    })),
  ];

  const insert = sqlite.prepare(`
    INSERT INTO "Bet" (
      "id", "userId", "title", "sportsbook", "sport", "market", "currency",
      "result", "stake", "odds", "profitLoss", "placedAt", "createdAt"
    ) VALUES (?, 'user-1', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const bet of bets) {
    const placedAt = bet.placedAt?.toISOString() ?? null;
    insert.run(
      bet.id,
      bet.title,
      bet.sportsbook ?? null,
      bet.sport ?? null,
      bet.market ?? null,
      bet.currency ?? "USD",
      bet.result,
      bet.stake,
      bet.odds,
      bet.profitLoss ?? null,
      placedAt,
      (bet.createdAt ?? bet.placedAt ?? new Date()).toISOString(),
    );
  }
  sqlite.close();

  process.env.DATABASE_URL = `file:${databasePath}`;
  const { loadDashboardSnapshot } = await import("../src/lib/dashboard-snapshot");
  const client = new PrismaClient({
    adapter: new PrismaLibSql({ url: `file:${databasePath}` }),
  });

  try {
    const referenceDate = new Date("2026-08-03T12:00:00.000Z");
    const snapshot = await loadDashboardSnapshot(
      client,
      "user-1",
      "America/Santiago",
      "USD",
      referenceDate,
    );
    const expected = calculateDashboardMetrics(bets, "America/Santiago");
    const expectedMonthly = calculateDashboardMetrics(
      bets.filter((bet) => bet.placedAt && bet.placedAt >= new Date("2025-09-01T04:00:00.000Z")),
      "America/Santiago",
    ).monthlyProfitLoss;

    assert.deepEqual(
      {
        ...snapshot.metrics,
        monthlyProfitLoss: undefined,
        sportExposure: undefined,
        marketExposure: undefined,
      },
      {
        ...expected,
        monthlyProfitLoss: undefined,
        sportExposure: undefined,
        marketExposure: undefined,
      },
    );
    assert.deepEqual(snapshot.metrics.monthlyProfitLoss, expectedMonthly);
    assert.deepEqual(snapshot.metrics.sportExposure, expected.sportExposure.slice(0, 6));
    assert.deepEqual(snapshot.metrics.marketExposure, expected.marketExposure.slice(0, 6));
    assert.equal(snapshot.metrics.currentWinningStreak, 20);
    assert.equal(snapshot.recentBets.length, 5);
    assert.equal(snapshot.preferredCurrency, "CLP");
  } finally {
    await client.$disconnect();
  }
});

test("Dashboard and Health contain no unbounded historical Bet findMany", async () => {
  const [dashboard, health, responsibleGaming] = await Promise.all([
    readFile(new URL("../src/app/dashboard/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/health/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/responsible-gaming.ts", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(dashboard, /prisma\.bet\.findMany/);
  assert.doesNotMatch(health, /prisma\.bet\.findMany/);
  assert.match(dashboard, /getDashboardSnapshot/);
  assert.match(health, /getDashboardSnapshot/);
  assert.match(responsibleGaming, /SUM\(CASE[\s\S]*dailyStake[\s\S]*weeklyStake[\s\S]*monthlyStake/);
});
