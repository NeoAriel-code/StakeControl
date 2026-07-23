# Production Email Domain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete StakeControl's canonical-domain transactional-email implementation without replacing compatible existing functionality.

**Architecture:** Keep the existing delivery ledger, token stores, Resend webhook and `EmailDeliveryService`; add a small provider boundary and canonical configuration layer around them. Add only the two missing account notifications, move the welcome event to completed onboarding, and extend webhook/event persistence and tests.

**Tech Stack:** Next.js server actions and route handlers, TypeScript, Prisma/Turso, Resend Node SDK, Node test runner.

## Global Constraints

- Use `getstakecontrol.com` hosts as the production canonical URLs; never introduce `stakecontrol.vercel.app`.
- Keep `RESEND_API_KEY` server-only and never use a `NEXT_PUBLIC_` name for it.
- Production startup must reject missing required email/domain configuration.
- Every Resend send must include a provider idempotency key as well as the existing database dedupe key.
- Account-action tokens must be hashed, expiring and single-use.
- Do not log webhook bodies, recipient addresses or token values.

---

### Task 1: Canonical email configuration and provider boundary

**Files:**
- Create: `src/lib/email/email-provider.ts`
- Create: `src/lib/email/resend-provider.ts`
- Modify: `src/lib/email/email-config.ts`
- Modify: `src/lib/email/email-service.ts`
- Modify: `.env.example`
- Test: `tests/email-config.test.mts`

**Interfaces:**
- Produces `getEmailConfiguration(environment)` with canonical sender fields and compatible legacy aliases.
- Produces `assertProductionEmailConfiguration(environment)` and `ResendEmailProvider.send(input)`.

- [ ] **Step 1: Write failing tests** for canonical sender variables, missing production configuration and provider idempotency input.
- [ ] **Step 2: Run `npm test -- tests/email-config.test.mts`** and confirm the new assertions fail because the exports/configuration do not exist.
- [ ] **Step 3: Implement** canonical variables with `EMAIL_FROM` retained as a fallback alias, production validation, and a Resend provider that calls `resend.emails.send(payload, { idempotencyKey })`.
- [ ] **Step 4: Run `npm test -- tests/email-config.test.mts`** and confirm it passes.

### Task 2: Account lifecycle email coverage

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260723120000_add_account_email_delivery_kinds/migration.sql`
- Modify: `src/lib/schema-migrations.ts`
- Modify: `src/lib/email/email-delivery.ts`
- Modify: `src/lib/email/email-service.ts`
- Modify: `src/lib/auth-actions.ts`
- Modify: `src/app/verify-email/page.tsx`
- Test: `tests/email-delivery.test.mts`

**Interfaces:**
- Produces `sendEmailChanged`, `sendAccountDeleted` and `sendWelcome` after first onboarding completion.
- Extends `EmailDeliveryKind` with `EMAIL_CHANGED` and `ACCOUNT_DELETED`.

- [ ] **Step 1: Write failing tests** asserting idempotent email-change/deletion notifications and onboarding-triggered welcome semantics.
- [ ] **Step 2: Run `npm test -- tests/email-delivery.test.mts`** and confirm the assertions fail because those methods and kinds do not exist.
- [ ] **Step 3: Implement** the two templates/delivery methods, suppress only nonessential messages, and send welcome only after the first completed onboarding transaction.
- [ ] **Step 4: Run `npm test -- tests/email-delivery.test.mts`** and confirm it passes.

### Task 3: Complete webhook event lifecycle and safe observability

**Files:**
- Modify: `src/lib/email/email-webhook.ts`
- Modify: `src/lib/email/email-service.ts`
- Modify: `src/app/api/webhooks/resend/route.ts`
- Test: `tests/email-webhook.test.mts`
- Test: `tests/resend-webhook-route.test.mts`

**Interfaces:**
- `processEmailWebhookEvent` accepts the six specified Resend event types and persists each timestamp safely.
- Duplicate provider event identifiers return `duplicate`; bounce/complaint creates hashed-address suppression.

- [ ] **Step 1: Write failing tests** for `email.sent`, duplicate events, bounce, complaint and no-recipient-body persistence.
- [ ] **Step 2: Run `npm test -- tests/email-webhook.test.mts tests/resend-webhook-route.test.mts`** and confirm only new lifecycle assertions fail.
- [ ] **Step 3: Implement** sent event storage, typed event filtering, signature/configuration checks, and redacted failure recording without provider body logging.
- [ ] **Step 4: Run `npm test -- tests/email-webhook.test.mts tests/resend-webhook-route.test.mts`** and confirm it passes.

### Task 4: Canonical URL/template and token regression tests

**Files:**
- Test: `tests/email-templates.test.mts`
- Test: `tests/email-verification.test.mts`
- Test: `tests/password-recovery.test.mts`
- Test: `tests/host-routing.test.mts`

- [ ] **Step 1: Write failing tests** that reject Vercel URLs in production/template source and cover expired and reused verification/reset tokens.
- [ ] **Step 2: Run the four focused test files** and confirm the new assertions fail only where coverage is absent.
- [ ] **Step 3: Make minimal fixes** if a canonical URL or token invariant fails; otherwise retain the verified implementation.
- [ ] **Step 4: Re-run the four focused test files** and confirm they pass.

### Task 5: Production configuration, verification and deployment

**Files:**
- Modify only if verification reveals a remaining gap.

- [ ] **Step 1: Add missing production environment names** in Vercel with canonical app URL and verified Resend sender/reply-to values; preserve legacy compatible variables.
- [ ] **Step 2: Ensure the Resend dashboard subscribes the existing signed endpoint to all six required events, including `email.sent`.**
- [ ] **Step 3: Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.**
- [ ] **Step 4: Commit, push main, deploy production and inspect the production deployment.**
