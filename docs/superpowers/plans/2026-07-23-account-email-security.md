# Account Email Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Require verified email addresses for new accounts and send account-security emails.

**Architecture:** Store a verification timestamp and SHA-256 token hashes in Prisma. Server actions create and consume opaque links before granting a session. The Resend adapter keeps the verified no-reply address and routes replies to support.

**Tech Stack:** Next.js 16, TypeScript, Prisma 7/libSQL, Resend, Zod, Node test runner.

## Global Constraints

- Use `StakeControl Seguridad <no-reply@notify.getstakecontrol.com>` for security messages and keep Reply-To at support.
- Generate verification tokens with 32 random bytes; hash with SHA-256; expire after 24 hours; consume once.
- Backfill existing users as verified; apply the gate only to newly registered users.
- Limit registration, verification resend, and password-reset attempts to three normalized-email requests per hour.
- Do not add CAPTCHA, payment changes, disposable-email filters, a new sender address, or third-party identity providers.

### Task 1: Verification data and tokens

**Files:** `prisma/schema.prisma`, `prisma/migrations/20260723090000_add_email_verification/migration.sql`, `src/lib/email-verification.ts`, `tests/email-verification.test.mts`.

- [ ] Write tests that assert the token hash differs from plaintext; future unused tokens are usable; expired or used tokens are not usable.
- [ ] Run `node --import tsx --test tests/email-verification.test.mts`; expect failure because the module is absent.
- [ ] Add `User.emailVerifiedAt` and `EmailVerificationToken` with unique `tokenHash`, user relation, expiry, used timestamp, and user/expiry index. The migration must backfill existing `emailVerifiedAt` with `CURRENT_TIMESTAMP`.
- [ ] Implement creation with `randomBytes(32).toString("base64url")`, SHA-256, 24-hour expiry, and transactional invalidation of prior unused tokens. Implement atomic consumption using `usedAt: null` and `expiresAt: { gt: now }` conditions.
- [ ] Run `node --import tsx --test tests/email-verification.test.mts` and `npx prisma validate`; expect success.
- [ ] Commit with `git commit -m "Add email verification tokens"`.

### Task 2: Verification and password-change email deliveries

**Files:** `prisma/schema.prisma`, `src/lib/email/email-delivery.ts`, `src/lib/email/email-service.ts`, `tests/email-delivery.test.mts`.

- [ ] Write tests for `sendEmailVerification` with subject `Confirma tu correo de StakeControl`, a confirmation URL, and expiry copy; write tests for `sendPasswordChanged` with subject `Tu contraseña de StakeControl fue modificada` and `support@getstakecontrol.com` copy.
- [ ] Run `node --import tsx --test tests/email-delivery.test.mts`; expect failure because these methods are absent.
- [ ] Add `EMAIL_VERIFICATION` and `PASSWORD_CHANGED` delivery kinds. Implement dedupe keys `email-verification:${sha256(token)}` and `password-changed:${userId}:${unixMinute}`. Keep no-reply address, use the security display name, and retain existing Reply-To.
- [ ] Send welcome mail only after verification; do not send it during registration.
- [ ] Run `node --import tsx --test tests/email-delivery.test.mts`; expect success. Commit `Send account security emails`.

### Task 3: Verification gate and resend UI

**Files:** `src/lib/auth-actions.ts`, `src/lib/email-verification-actions.ts`, `src/app/verify-email/page.tsx`, `src/app/verify-email/resend/page.tsx`, `src/components/auth/ResendVerificationForm.tsx`, `src/components/auth/RegisterForm.tsx`, `src/components/auth/LoginForm.tsx`, `tests/email-verification-actions.test.mts`.

- [ ] Write action tests proving registration creates no session and sends one verification email; login returns `Debes confirmar tu correo antes de ingresar.` for valid unverified credentials; verify action creates a session only after a valid token.
- [ ] Run `node --import tsx --test tests/email-verification-actions.test.mts`; expect failure because registration creates a session and login permits access.
- [ ] In registration, rate-limit `register:${email}`, create an unverified user, issue/send verification link, and return `Revisa tu correo para confirmar tu cuenta.` without a session. In login, check `emailVerifiedAt` after password validation and before session creation.
- [ ] Add verify page that consumes a query token and creates a session only when valid. Add resend page/action limited at `verify-resend:${email}`; return generic success for all emails and only send for an existing unverified account.
- [ ] Run `node --import tsx --test tests/email-verification.test.mts tests/email-verification-actions.test.mts tests/password-recovery.test.mts`; expect success. Commit `Require verified email accounts`.

### Task 4: Password-change notification dispatch

**Files:** `src/lib/settings-actions.ts`, `src/lib/password-recovery-actions.ts`, `tests/password-change-notification.test.mts`.

- [ ] Write tests proving both successful in-session and reset-token password changes call `sendPasswordChanged` once.
- [ ] Run `node --import tsx --test tests/password-change-notification.test.mts`; expect failure because neither path sends it.
- [ ] After each successful password persistence, invoke `sendPasswordChanged({ userId, email })`; log delivery failure without rolling back the password change. Never send password, hash, token, or reset URL.
- [ ] Re-run the focused test; expect success. Commit `Notify users about password changes`.

### Task 5: Verify and deploy

- [ ] Run migration against `file:/tmp/stakecontrol-email-security.db`, then run `npm test`, `npm run lint`, `npm run typecheck`, and production build with a disposable `DATABASE_URL`; all must exit 0.
- [ ] Run `git diff --check` and `git status --short`; expect no whitespace errors or uncommitted changes.
- [ ] Push `main`; confirm Vercel's newest production deployment is `READY` and matches the final commit.
