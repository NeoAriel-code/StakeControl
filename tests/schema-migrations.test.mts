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

test("registers the Resend webhook migration for the production runner", () => {
  const migration = MANAGED_SCHEMA_MIGRATIONS.find(
    (candidate) => candidate.name === "20260723110000_add_resend_webhooks",
  );

  assert.deepEqual(migration?.requiredTables, ["EmailWebhookEvent", "RestrictedEmailAddress", "AccountSecurityAlert"]);
});

test("registers account email delivery kinds for the production runner", () => {
  const migration = MANAGED_SCHEMA_MIGRATIONS.find(
    (candidate) => candidate.name === "20260723120000_add_account_email_delivery_kinds",
  );

  assert.deepEqual(migration, {
    name: "20260723120000_add_account_email_delivery_kinds",
    sqlPath: "prisma/migrations/20260723120000_add_account_email_delivery_kinds/migration.sql",
    requiredTables: ["EmailDelivery"],
  });
});

test("applies a column migration when its required columns are absent", () => {
  const migration = MANAGED_SCHEMA_MIGRATIONS.find(
    (candidate) => candidate.name === "20260723130000_add_beta_terms",
  );

  assert.ok(migration);
  assert.deepEqual(
    planSchemaMigration(
      migration,
      new Set(["User"]),
      new Set(),
      new Map([["User", new Set(["id", "email"])]])
    ),
    { action: "apply", name: "20260723130000_add_beta_terms" },
  );
});

test("baselines a column migration only when all required columns already exist", () => {
  const migration = MANAGED_SCHEMA_MIGRATIONS.find(
    (candidate) => candidate.name === "20260723130000_add_beta_terms",
  );

  assert.ok(migration);
  assert.deepEqual(
    planSchemaMigration(
      migration,
      new Set(["User"]),
      new Set(),
      new Map([["User", new Set(["id", "email", "betaTermsAcceptedAt", "betaTermsVersion"])]])
    ),
    { action: "baseline", name: "20260723130000_add_beta_terms" },
  );
});

test("the build command runs the production migration runner before Next", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

  assert.match(packageJson.scripts.build, /^node --import tsx scripts\/migrate-production\.mts && next build$/);
});

test("plans application, baseline, repetition and partial-index rejection", () => {
  const migration = MANAGED_SCHEMA_MIGRATIONS.find(
    (candidate) => candidate.name === "20260803090000_add_production_performance_indexes",
  );
  assert.ok(migration);
  const tables = new Set(["Bet", "ResponsibleGamingAlert", "Subscription", "ProductFeedback"]);
  const indexes = new Set(migration.requiredIndexes);

  assert.deepEqual(
    planSchemaMigration(migration, tables, new Set(), new Map(), new Set()),
    { action: "apply", name: migration.name },
  );
  assert.deepEqual(
    planSchemaMigration(migration, tables, new Set(), new Map(), indexes),
    { action: "baseline", name: migration.name },
  );
  assert.deepEqual(
    planSchemaMigration(migration, tables, new Set([migration.name]), new Map(), indexes),
    { action: "skip", name: migration.name },
  );
  assert.deepEqual(
    planSchemaMigration(
      migration,
      tables,
      new Set(),
      new Map(),
      new Set([migration.requiredIndexes![0]]),
    ),
    { action: "inconsistent", name: migration.name },
  );
  assert.deepEqual(
    planSchemaMigration(migration, tables, new Set([migration.name]), new Map(), new Set()),
    { action: "inconsistent", name: migration.name },
  );
});

test("beta hardening migrations can apply independently to an existing User table", () => {
  const sessionMigration = MANAGED_SCHEMA_MIGRATIONS.find(
    (candidate) => candidate.name === "20260804090000_beta_security_hardening",
  );
  const auditMigration = MANAGED_SCHEMA_MIGRATIONS.find(
    (candidate) => candidate.name === "20260804090500_add_admin_access_audit",
  );
  assert.ok(sessionMigration);
  assert.ok(auditMigration);
  assert.deepEqual(
    planSchemaMigration(sessionMigration, new Set(["User"]), new Set(), new Map([["User", new Set(["id", "email"])]])),
    { action: "apply", name: sessionMigration.name },
  );
  assert.deepEqual(
    planSchemaMigration(auditMigration, new Set(["User"]), new Set()),
    { action: "apply", name: auditMigration.name },
  );
});
