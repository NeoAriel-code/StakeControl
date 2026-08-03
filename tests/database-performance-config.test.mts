import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { assertProductionDatabaseConfiguration } from "../src/lib/database-config";

test("production requires a token-authenticated libsql Turso URL", () => {
  assert.doesNotThrow(() => assertProductionDatabaseConfiguration({ VERCEL_ENV: "preview" }));
  assert.doesNotThrow(() => assertProductionDatabaseConfiguration({
    VERCEL_ENV: "production",
    DATABASE_URL: "libsql://stakecontrol.turso.io",
    TURSO_AUTH_TOKEN: "configured",
  }));
  assert.throws(
    () => assertProductionDatabaseConfiguration({
      VERCEL_ENV: "production",
      DATABASE_URL: "file:local.db",
      TURSO_AUTH_TOKEN: "configured",
    }),
    /libsql:\/\//,
  );
  assert.throws(
    () => assertProductionDatabaseConfiguration({
      VERCEL_ENV: "production",
      DATABASE_URL: "libsql://stakecontrol.turso.io",
    }),
    /TURSO_AUTH_TOKEN/,
  );
});

test("request-local auth and plan reads use React cache", async () => {
  const [auth, plans, prisma] = await Promise.all([
    readFile(new URL("../src/lib/auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/plans.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/prisma.ts", import.meta.url), "utf8"),
  ]);

  assert.match(auth, /cache\(async \(\) =>/);
  assert.match(plans, /cache\(async \(userId: string\)/);
  assert.match(prisma, /globalForPrisma\.prisma = prisma/);
  assert.doesNotMatch(prisma, /NODE_ENV !== "production"/);
});

test("private data and framework assets retain their cache and proxy boundaries", async () => {
  const [proxy, exportRoute, ticketRoute, alertRoute] = await Promise.all([
    readFile(new URL("../src/proxy.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/bets/export.csv/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/tickets/[id]/file/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/alerts/unread/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(proxy, /_next\/static\|_next\/image/);
  for (const route of [exportRoute, ticketRoute, alertRoute]) {
    assert.match(route, /private, no-store/);
  }
});
