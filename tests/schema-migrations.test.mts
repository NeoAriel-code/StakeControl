import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { MANAGED_SCHEMA_MIGRATIONS, planSchemaMigration } from "../src/lib/schema-migrations";

test("baselines a managed migration when its required table already exists", () => {
  const migration = MANAGED_SCHEMA_MIGRATIONS[0];

  assert.deepEqual(
    planSchemaMigration(migration, new Set(["EmailDelivery", "NotificationPreferences"]), new Set()),
    { action: "baseline", name: "202607220002_add_email_notifications" },
  );
});

test("rejects a partially applied managed migration instead of baselining it", () => {
  const migration = MANAGED_SCHEMA_MIGRATIONS[0];

  assert.deepEqual(
    planSchemaMigration(migration, new Set(["EmailDelivery"]), new Set()),
    { action: "inconsistent", name: "202607220002_add_email_notifications" },
  );
});

test("applies a managed migration only when its table and ledger record are absent", () => {
  const migration = MANAGED_SCHEMA_MIGRATIONS[0];

  assert.deepEqual(
    planSchemaMigration(migration, new Set(), new Set()),
    { action: "apply", name: "202607220002_add_email_notifications" },
  );
});

test("skips a migration that is already recorded in the schema ledger", () => {
  const migration = MANAGED_SCHEMA_MIGRATIONS[0];

  assert.deepEqual(
    planSchemaMigration(migration, new Set(), new Set([migration.name])),
    { action: "skip", name: "202607220002_add_email_notifications" },
  );
});

test("registers the email verification migration for the production runner", () => {
  const migration = MANAGED_SCHEMA_MIGRATIONS.find(
    (candidate) => candidate.name === "20260723090000_add_email_verification",
  );

  assert.deepEqual(migration, {
    name: "20260723090000_add_email_verification",
    sqlPath: "prisma/migrations/20260723090000_add_email_verification/migration.sql",
    requiredTables: ["EmailVerificationToken"],
  });
});

test("the build command runs the production migration runner before Next", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

  assert.match(packageJson.scripts.build, /^node --import tsx scripts\/migrate-production\.mts && next build$/);
});
