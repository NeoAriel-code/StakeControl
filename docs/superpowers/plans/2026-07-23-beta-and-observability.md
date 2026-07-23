# Beta and Observability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make beta participation explicit, remove commercial Premium promises, and add privacy-preserving Sentry error monitoring.

**Architecture:** Store a versioned beta-consent record on `User`; enforce it for existing authenticated accounts and collect it within onboarding for new ones. Add a reusable beta badge, alter only public Premium marketing copy, and centralize Sentry filtering/reporting so application paths never attach sensitive payloads.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma/Turso, `@sentry/nextjs`, TypeScript, Node test runner.

## Global Constraints

- Do not commit or deploy this work until the user requests the single general release.
- Beta version is exactly `beta-2026-07-23`.
- Sentry must never receive emails, tokens, request bodies, OCR text, images, ticket codes, bet history/data, responsible-gaming answers, or attachments.
- Sentry may receive only a one-way hash of the internal user ID.
- Public Premium copy must not show price, payment availability, purchase expectations, or a commercial trial.

---

### Task 1: Versioned beta consent

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260723130000_add_beta_terms/migration.sql`
- Modify: `src/lib/schema-migrations.ts`
- Create: `src/lib/beta-terms.ts`
- Modify: `src/lib/auth-actions.ts`
- Modify: `src/lib/auth.ts`
- Create: `src/app/beta-terms/page.tsx`
- Create: `src/components/auth/BetaTermsForm.tsx`
- Modify: `src/components/auth/OnboardingForm.tsx`
- Test: `tests/beta-terms.test.mts`

**Interfaces:**
- Produces `BETA_TERMS_VERSION`, `hasAcceptedCurrentBetaTerms(user)` and `acceptBetaTermsAction`.
- `completeOnboardingAction` persists both beta fields atomically with onboarding completion.

- [ ] **Step 1: Write failing tests** for current-version acceptance and stale/missing acceptance.
- [ ] **Step 2: Run `node --import tsx --test tests/beta-terms.test.mts`** and confirm failures because the module does not exist.
- [ ] **Step 3: Implement** fields, migration, helpers, acceptance gate and onboarding checkbox/copy.
- [ ] **Step 4: Run focused tests** and confirm they pass.

### Task 2: Beta presentation and public Premium copy

**Files:**
- Create: `src/components/layout/BetaBadge.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Test: `tests/beta-public-copy.test.mts`

**Interfaces:**
- `BetaBadge` renders `StakeControl Beta` without changing existing navigation.

- [ ] **Step 1: Write failing static/render tests** asserting the beta badge and absence of `$4.990`, `CLP / mes`, and `Probar Premium` in landing source.
- [ ] **Step 2: Run `node --import tsx --test tests/beta-public-copy.test.mts`** and confirm failures.
- [ ] **Step 3: Implement** the badge and the exact three approved Premium Beta messages.
- [ ] **Step 4: Run focused tests** and confirm they pass.

### Task 3: Sentry privacy boundary and safe reporting

**Files:**
- Modify: `package.json`
- Create: `src/lib/observability/sentry-privacy.ts`
- Create: `src/lib/observability/sentry.ts`
- Create: `instrumentation-client.ts`
- Modify: `src/instrumentation.ts`
- Create: `sentry.server.config.ts`
- Create: `sentry.edge.config.ts`
- Modify: `next.config.ts`
- Modify: `.env.example`
- Test: `tests/sentry-privacy.test.mts`

**Interfaces:**
- Produces `scrubSentryEvent(event)` and `reportOperationalError(category, error, context?)`.
- `reportOperationalError` only sends a category and optional anonymized user ID; it rejects payload-bearing context.

- [ ] **Step 1: Write failing tests** proving email, tokens, request body, OCR/ticket/bet fields and attachments are removed while a hashed user ID is retained.
- [ ] **Step 2: Run `node --import tsx --test tests/sentry-privacy.test.mts`** and confirm failures.
- [ ] **Step 3: Install `@sentry/nextjs` and implement** runtime initialization, Next request capture and privacy filtering.
- [ ] **Step 4: Run focused tests** and confirm they pass.

### Task 4: Operational failure categories and final verification

**Files:**
- Modify: `src/lib/email/email-delivery.ts`
- Modify: relevant login, OCR, AI, persistence and export failure boundaries only where errors are already handled
- Test: `tests/observability-categories.test.mts`

- [ ] **Step 1: Write failing tests** for safe category-only calls at the selected boundaries.
- [ ] **Step 2: Run the focused test** and confirm it fails.
- [ ] **Step 3: Add category-only reporting** without appending user input, provider payloads or raw exception metadata.
- [ ] **Step 4: Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.**

### Manual configuration after release approval

- [ ] Create a Sentry Next.js project and add `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_ENVIRONMENT` in Vercel.
- [ ] Set Sentry issue and uptime alerts to `hola@getstakecontrol.com`.
- [ ] Create Uptime monitors for `https://getstakecontrol.com` and `https://getstakecontrol.com/api/health`.
