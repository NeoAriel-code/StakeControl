import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@libsql/client";
import { MANAGED_SCHEMA_MIGRATIONS, planSchemaMigration } from "../src/lib/schema-migrations";

function checksumFor(sql: string) {
  return createHash("sha256").update(sql).digest("hex");
}

async function run() {
  if (process.env.VERCEL_ENV !== "production") {
    console.info("[schema-migrations] skipped outside Vercel Production");
    return;
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("[schema-migrations] DATABASE_URL is required for a Vercel Production build.");
  }

  const client = createClient({
    url,
    ...(process.env.TURSO_AUTH_TOKEN ? { authToken: process.env.TURSO_AUTH_TOKEN } : {}),
  });

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "AppSchemaMigration" (
        "name" TEXT NOT NULL PRIMARY KEY,
        "checksum" TEXT NOT NULL,
        "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    for (const migration of MANAGED_SCHEMA_MIGRATIONS) {
      const sql = await readFile(resolve(process.cwd(), migration.sqlPath), "utf8");
      const checksum = checksumFor(sql);
      const transaction = await client.transaction();

      try {
        const [tableResult, ledgerResult] = await Promise.all([
          transaction.execute("SELECT name FROM sqlite_master WHERE type = 'table'"),
          transaction.execute('SELECT name, checksum FROM "AppSchemaMigration"'),
        ]);
        const existingTables = new Set(tableResult.rows.map((row) => String(row.name)));
        const ledger = new Map(
          ledgerResult.rows.map((row) => [String(row.name), String(row.checksum)] as const),
        );
        const columnTables = [...new Set(migration.requiredColumns?.map(({ table }) => table) ?? [])];
        const columnResults = await Promise.all(
          columnTables.map(async (table) => [
            table,
            await transaction.execute(`PRAGMA table_info("${table.replaceAll('"', '""')}")`),
          ] as const),
        );
        const existingColumns = new Map(
          columnResults.map(([table, result]) => [
            table,
            new Set(result.rows.map((row) => String(row.name))),
          ] as const),
        );
        const plan = planSchemaMigration(migration, existingTables, new Set(ledger.keys()), existingColumns);

        if (plan.action === "inconsistent") {
          throw new Error(
            `[schema-migrations] ${migration.name} is only partially present; refusing to guess how to repair it.`,
          );
        }

        if (plan.action === "skip") {
          if (ledger.get(migration.name) !== checksum) {
            throw new Error(`[schema-migrations] ${migration.name} changed after it was recorded.`);
          }
          console.info(`[schema-migrations] ${migration.name} already recorded`);
        } else {
          if (plan.action === "apply") {
            await transaction.executeMultiple(sql);
            console.info(`[schema-migrations] applied ${migration.name}`);
          } else {
            console.info(`[schema-migrations] baselined ${migration.name}`);
          }

          await transaction.execute({
            sql: 'INSERT INTO "AppSchemaMigration" ("name", "checksum") VALUES (?, ?)',
            args: [migration.name, checksum],
          });
        }

        await transaction.commit();
      } catch (error) {
        await transaction.rollback().catch(() => undefined);
        throw error;
      } finally {
        transaction.close();
      }
    }
  } finally {
    client.close();
  }
}

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
