export type ManagedSchemaMigration = {
  name: string;
  sqlPath: string;
  requiredTables: readonly string[];
};

export const MANAGED_SCHEMA_MIGRATIONS: readonly ManagedSchemaMigration[] = [
  {
    name: "202607220002_add_email_notifications",
    sqlPath: "prisma/migrations/202607220002_add_email_notifications/migration.sql",
    requiredTables: ["EmailDelivery", "NotificationPreferences"],
  },
  {
    name: "20260723090000_add_email_verification",
    sqlPath: "prisma/migrations/20260723090000_add_email_verification/migration.sql",
    requiredTables: ["EmailVerificationToken"],
  },
  {
    name: "20260723110000_add_resend_webhooks",
    sqlPath: "prisma/migrations/20260723110000_add_resend_webhooks/migration.sql",
    requiredTables: ["EmailWebhookEvent", "RestrictedEmailAddress", "AccountSecurityAlert"],
  },
  {
    name: "20260723120000_add_account_email_delivery_kinds",
    sqlPath: "prisma/migrations/20260723120000_add_account_email_delivery_kinds/migration.sql",
    requiredTables: ["EmailDelivery"],
  },
];

export type SchemaMigrationPlan = {
  action: "apply" | "baseline" | "skip" | "inconsistent";
  name: string;
};

export function planSchemaMigration(
  migration: ManagedSchemaMigration,
  existingTables: ReadonlySet<string>,
  recordedNames: ReadonlySet<string>,
): SchemaMigrationPlan {
  if (recordedNames.has(migration.name)) {
    return { action: "skip", name: migration.name };
  }

  const existingRequiredTables = migration.requiredTables.filter((table) => existingTables.has(table));

  if (existingRequiredTables.length === migration.requiredTables.length) {
    return { action: "baseline", name: migration.name };
  }

  if (existingRequiredTables.length === 0) {
    return { action: "apply", name: migration.name };
  }

  return { action: "inconsistent", name: migration.name };
}
