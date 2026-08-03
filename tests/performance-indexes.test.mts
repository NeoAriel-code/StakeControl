import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Database from "better-sqlite3";

test("canonical production queries use the additive performance indexes", async () => {
  const database = new Database(":memory:");
  database.exec(`
    CREATE TABLE "Bet" ("id" TEXT PRIMARY KEY, "userId" TEXT, "result" TEXT, "placedAt" DATETIME);
    CREATE TABLE "ResponsibleGamingAlert" ("id" TEXT PRIMARY KEY, "userId" TEXT, "acknowledgedAt" DATETIME, "createdAt" DATETIME);
    CREATE TABLE "Subscription" ("id" TEXT PRIMARY KEY, "userId" TEXT, "status" TEXT, "createdAt" DATETIME);
    CREATE TABLE "ProductFeedback" ("id" TEXT PRIMARY KEY, "reviewStatus" TEXT, "createdAt" DATETIME);
  `);
  const migration = await readFile(
    new URL("../prisma/migrations/20260803090000_add_production_performance_indexes/migration.sql", import.meta.url),
    "utf8",
  );
  database.exec(migration);

  const plans = [
    {
      index: "Bet_userId_result_placedAt_idx",
      sql: "SELECT * FROM Bet WHERE userId = ? AND result = ? ORDER BY placedAt DESC LIMIT 5",
      args: ["user", "WON"],
    },
    {
      index: "ResponsibleGamingAlert_userId_acknowledgedAt_createdAt_idx",
      sql: "SELECT * FROM ResponsibleGamingAlert WHERE userId = ? AND acknowledgedAt IS NULL ORDER BY createdAt DESC LIMIT 20",
      args: ["user"],
    },
    {
      index: "Subscription_userId_status_createdAt_idx",
      sql: "SELECT * FROM Subscription WHERE userId = ? AND status = ? ORDER BY createdAt DESC LIMIT 1",
      args: ["user", "active"],
    },
    {
      index: "ProductFeedback_reviewStatus_createdAt_idx",
      sql: "SELECT * FROM ProductFeedback WHERE reviewStatus = ? ORDER BY createdAt DESC LIMIT 20",
      args: ["NEW"],
    },
  ];

  for (const query of plans) {
    const details = database
      .prepare(`EXPLAIN QUERY PLAN ${query.sql}`)
      .all(...query.args)
      .map((row) => String((row as { detail: unknown }).detail))
      .join("\n");
    assert.match(details, new RegExp(`USING INDEX ${query.index}|USING COVERING INDEX ${query.index}`));
    assert.doesNotMatch(details, /SCAN (Bet|ResponsibleGamingAlert|Subscription|ProductFeedback)/);
  }

  database.close();
});
