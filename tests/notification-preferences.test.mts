import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function readProjectFile(path: string) {
  return readFile(resolve(process.cwd(), path), "utf8");
}

test("notification persistence has user-scoped preferences and a unique delivery key", async () => {
  const [schema, migration] = await Promise.all([
    readProjectFile("prisma/schema.prisma"),
    readProjectFile("prisma/migrations/202607220002_add_email_notifications/migration.sql"),
  ]);

  assert.match(schema, /model NotificationPreferences/);
  assert.match(schema, /userId\s+String\s+@unique/);
  assert.match(schema, /model EmailDelivery/);
  assert.match(schema, /dedupeKey\s+String\s+@unique/);
  assert.match(migration, /CREATE TABLE "NotificationPreferences"/);
  assert.match(migration, /CREATE TABLE "EmailDelivery"/);
});
