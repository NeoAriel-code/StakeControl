# Production Schema Migrations Design

## Problem

Production can run application code whose Prisma models expect tables that have
not been created. The existing Prisma migration history predates the current
deployment workflow and cannot safely be replayed wholesale during a deploy.

## Decision

Manage a small, explicit manifest of production migrations from the current
baseline forward. The first managed migration is
`202607220002_add_email_notifications`.

During a Vercel Production build, a migration runner will:

1. Connect using the deployment's `DATABASE_URL` and `TURSO_AUTH_TOKEN`.
2. Create an application-owned `AppSchemaMigration` ledger if it is missing.
3. For every manifest entry, record it as applied when its required table
   already exists; otherwise execute its checked-in SQL and record it.
4. Stop the build on any connection, execution, or consistency error.

The runner will be a no-op outside `VERCEL_ENV=production`, so preview and
local builds never alter the production database.

## Boundaries

- The runner does not replay or modify pre-baseline Prisma migrations.
- The runner does not delete or rewrite production data.
- New production schema changes must add a manifest entry and a checked-in SQL
  migration in the same change.
- The existing email-delivery fallback remains as runtime resilience, but it is
  no longer the mechanism relied upon to keep the schema current.

## Verification

Unit tests will cover manifest selection and the invariant that a pre-existing
required table is baselined without executing SQL. The complete test suite,
typecheck, and a production deployment build will be run. Deployment logs must
show either application or baseline recording for the email-notification
migration.
