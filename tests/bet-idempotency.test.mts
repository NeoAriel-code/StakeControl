import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readProjectFile(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("manual bet creation carries a server-issued idempotency key", async () => {
  const [page, form] = await Promise.all([
    readProjectFile("src/app/bets/new/page.tsx"),
    readProjectFile("src/components/bets/BetForm.tsx"),
  ]);

  assert.match(page, /randomUUID\(\)/);
  assert.match(page, /creationKey=\{randomUUID\(\)\}/);
  assert.match(form, /name="creationKey"/);
  assert.match(form, /value=\{creationKey\}/);
});

test("manual bet creation upserts against a user-scoped unique key", async () => {
  const [schema, action, migration] = await Promise.all([
    readProjectFile("prisma/schema.prisma"),
    readProjectFile("src/lib/bet-actions.ts"),
    readProjectFile("prisma/migrations/202607220001_add_bet_creation_key/migration.sql"),
  ]);

  assert.match(schema, /creationKey\s+String\?/);
  assert.match(schema, /@@unique\(\[userId, creationKey\]\)/);
  assert.match(action, /prisma\.bet\.upsert/);
  assert.match(action, /userId_creationKey/);
  assert.match(migration, /CREATE UNIQUE INDEX "Bet_userId_creationKey_key"/);
});
