# Logical Redesign Backport Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backport only demonstrated correctness and data-integrity fixes from `feat/stakecontrol-redesign` into `main`, without importing redesign, localization, copy, or UX changes.

**Architecture:** Keep the current Spanish action-state and page interfaces. Extract only server/domain behavior into existing libraries: timezone conversion in `user-time-periods`, durable persistence sequencing, and ticket-upload compensation. Add the smallest caller changes required to use those utilities.

**Tech Stack:** Next.js server actions, TypeScript, Prisma, Node test runner.

## Global Constraints

- Do not copy CSS, page markup, navigation, locale routing, translations, or visual components from `redesign`.
- Preserve existing public action-state shapes and Spanish messages on `main`.
- Use test-first changes; every migrated behavior needs a focused regression test.
- Do not add dependencies.

---

### Task 1: User-timezone correctness for persisted dates and dashboard months

**Files:**
- Modify: `src/lib/user-time-periods.ts`
- Modify: `src/lib/dashboard-metrics.ts`
- Modify: `src/lib/bet-actions.ts`
- Modify: `src/lib/ticket-actions.ts`
- Test: `tests/user-time-periods.test.mts`
- Test: `tests/dashboard-metrics.test.mts`

- [ ] **Step 1: Write failing tests** for a `datetime-local` value in `America/Santiago` resolving to the corresponding UTC instant, and for a dashboard month keyed in the supplied timezone.
- [ ] **Step 2: Run** `node --import tsx --test tests/user-time-periods.test.mts tests/dashboard-metrics.test.mts` and confirm the tests fail because the helpers or timezone parameter are missing.
- [ ] **Step 3: Implement** `parseDateTimeInUserTimezone(value, timezone)` and use it in manual-bet and ticket-review persistence; pass the user timezone through dashboard metrics.
- [ ] **Step 4: Run** the focused tests and confirm they pass.

### Task 2: Durable save flows and ticket-upload compensation

**Files:**
- Create: `src/lib/post-persistence.ts`
- Modify: `src/lib/bet-actions.ts`
- Modify: `src/lib/ticket-actions.ts`
- Modify: `src/lib/ticket-upload-utils.ts`
- Test: `tests/post-persistence.test.mts`
- Test: `tests/ticket-upload-action.test.mts`

- [ ] **Step 1: Write failing tests** proving that a failed alert refresh does not change a completed persistence result and that ticket cleanup attempts both the database row and stored object after a later upload failure.
- [ ] **Step 2: Run** `node --import tsx --test tests/post-persistence.test.mts tests/ticket-upload-action.test.mts` and confirm the tests fail because the helper is absent.
- [ ] **Step 3: Implement** `persistThenRunBestEffort`, wrap post-save alert evaluation with it, make image/extraction persistence transactional, and invoke compensating cleanup on post-OCR failures.
- [ ] **Step 4: Run** the focused tests and confirm they pass.

### Task 3: Manual-bet idempotency and financial input validity

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/202607220001_add_bet_creation_key/migration.sql`
- Modify: `src/lib/bet-actions.ts`
- Modify: `src/lib/bet-schemas.ts`
- Modify: `src/lib/bet-outcomes.ts`
- Modify: `src/app/bets/new/page.tsx`
- Modify: `src/components/bets/BetForm.tsx`
- Test: `tests/bet-idempotency.test.mts`
- Test: `tests/validation-schemas.test.mts`

- [ ] **Step 1: Write failing tests** for a user-scoped creation UUID with an upsert and for requiring a manually supplied net result only for `WON` and `CASHOUT` bets.
- [ ] **Step 2: Run** `node --import tsx --test tests/bet-idempotency.test.mts tests/validation-schemas.test.mts` and confirm the tests fail because the creation key and conditional validation are missing.
- [ ] **Step 3: Implement** the nullable `creationKey` schema/migration, server validation and upsert, a server-rendered hidden UUID field, and conditional `netProfit` validation while retaining current messages.
- [ ] **Step 4: Run** the focused tests and confirm they pass.

### Task 4: Final verification

**Files:**
- Test: `tests/*.test.mts`

- [ ] **Step 1: Run** `npm run typecheck`.
- [ ] **Step 2: Run** `npm test`.
- [ ] **Step 3: Run** `npm run build` with a disposable local SQLite `DATABASE_URL` if the normal environment has no configured database.
- [ ] **Step 4: Inspect** `git diff --check` and the final diff to ensure it contains no CSS, copy, locale, routing, or design-system changes.
