# Production Schema Migrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply checked-in, post-baseline schema migrations during Vercel Production builds before application code is built.

**Architecture:** A small TypeScript module defines the approved migration manifest and computes whether each migration must run or can be baselined. A Node runner connects to Turso, maintains an `AppSchemaMigration` ledger, and is invoked before `next build` only when `VERCEL_ENV` is `production`.

**Tech Stack:** Node.js, TypeScript, `@libsql/client`, Vercel, Prisma migration SQL.

## Global Constraints

- Never replay historical Prisma migrations before `202607220002_add_email_notifications`.
- Never mutate the database from preview or local builds.
- Missing or unusable Production database credentials must fail a Production build.
- All managed migrations need a checked-in SQL file and a required-table baseline check.

---

### Task 1: Define the managed migration manifest

**Files:**
- Create: `src/lib/schema-migrations.ts`
- Create: `tests/schema-migrations.test.mts`

**Interfaces:**
- Produces: `MANAGED_SCHEMA_MIGRATIONS`, `planSchemaMigration({ name, requiredTable }, existingTables, recordedNames)`.

- [ ] **Step 1: Write the failing test**

```ts
assert.deepEqual(
  planSchemaMigration(MANAGED_SCHEMA_MIGRATIONS[0], new Set(["EmailDelivery"]), new Set()),
  { action: "baseline", name: "202607220002_add_email_notifications" },
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/schema-migrations.test.mts`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
export const MANAGED_SCHEMA_MIGRATIONS = [{
  name: "202607220002_add_email_notifications",
  sqlPath: "prisma/migrations/202607220002_add_email_notifications/migration.sql",
  requiredTable: "EmailDelivery",
}] as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/schema-migrations.test.mts`
Expected: PASS.

### Task 2: Add the production migration runner

**Files:**
- Create: `scripts/migrate-production.mts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `MANAGED_SCHEMA_MIGRATIONS` and `DATABASE_URL` / `TURSO_AUTH_TOKEN`.
- Produces: `npm run build` runs the migration runner before `next build`.

- [ ] **Step 1: Write the failing static integration test**

```ts
assert.match(packageJson.scripts.build, /migrate-production/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/schema-migrations.test.mts`
Expected: FAIL because the build script does not invoke the runner.

- [ ] **Step 3: Write minimal runner**

```ts
if (process.env.VERCEL_ENV !== "production") process.exit(0);
// Create ledger, inspect sqlite_master, execute missing SQL in a transaction,
// then insert its migration name and SHA-256 checksum.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/schema-migrations.test.mts`
Expected: PASS.

### Task 3: Verify and deploy

**Files:**
- Modify: none

- [ ] **Step 1: Run focused and full tests**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 2: Run typecheck and local build**

Run: `npm run typecheck && DATABASE_URL='file:./dev.db' AUTH_SECRET='stakecontrol-local-dev-secret' NEXT_PUBLIC_APP_URL='http://localhost:3000' npm run build`
Expected: exit code 0; the runner reports it skipped outside Vercel Production.

- [ ] **Step 3: Commit and push**

```bash
git add docs/superpowers prisma src scripts tests package.json
git commit -m "Automate production schema migrations"
git push origin main
```

- [ ] **Step 4: Deploy to Vercel Production and inspect logs**

Run: `vercel --prod --yes`
Expected: build succeeds and logs show the migration was applied or baselined.
