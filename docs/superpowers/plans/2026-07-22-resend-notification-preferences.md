# Resend Notification Preferences Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Send password recovery, welcome, and opted-in responsible-gaming emails through Resend without duplicate delivery or blocking primary actions.

**Architecture:** A server-only email adapter owns Resend configuration, templates, and delivery outcomes. Prisma stores per-alert-type preferences plus an email-delivery ledger; onboarding and settings update preferences, while alert evaluation dispatches only newly inserted alerts.

**Tech Stack:** Next.js 16 Server Actions, TypeScript, Prisma 7/libSQL, Zod 4, Resend Node SDK, Node test runner with tsx.

## Global Constraints

- Use EMAIL_FROM; never hard-code the sender or expose RESEND_API_KEY.
- Password recovery must preserve its generic, non-enumerating response.
- Email failure never rolls back account creation, alerts, bets, tickets, or limit changes.
- Alert email requires onboarding consent and a preference for that exact AlertType.
- Existing users without preferences receive no alert mail until they opt in.
- Reset and welcome mail are transactional; they bypass alert preferences.
- Begin each production change with a focused failing test.

---

## File Structure

- prisma/schema.prisma and prisma/migrations/202607220002_add_email_notifications/migration.sql: persistent preferences and delivery ledger.
- src/lib/email/email-config.ts, email-client.ts, email-templates.ts, email-delivery.ts: Resend adapter boundary.
- src/lib/notification-preferences.ts: one mapping for every alert type and preference resolver.
- src/lib/auth-actions.ts, src/lib/password-recovery-actions.ts, src/lib/responsible-gaming.ts, src/lib/settings-actions.ts: lifecycle wiring.
- src/components/auth/OnboardingForm.tsx, src/components/settings/EmailNotificationPreferencesForm.tsx, src/app/onboarding/page.tsx, src/app/settings/page.tsx: consent and individual controls.
- tests/email-config.test.mts, tests/email-delivery.test.mts, tests/notification-preferences-actions.test.mts, tests/responsible-gaming-email.test.mts and tests/welcome-email.test.mts: behavior coverage.

## Task 1: Persist preferences and delivery records

**Files:**
- Modify: prisma/schema.prisma
- Create: prisma/migrations/202607220002_add_email_notifications/migration.sql
- Create: tests/notification-preferences.test.mts

**Interfaces:**
- NotificationPreferences has unique userId, master emailAlertsEnabled, and one boolean for each existing alert type.
- EmailDelivery has userId, optional alertId, unique dedupeKey, kind, status, Resend id, bounded failure reason, and timestamps.

- [ ] **Step 1: Write the failing schema contract test**

~~~ts
test("notification persistence has user-scoped preferences and a unique delivery key", async () => {
  const schema = await readProjectFile("prisma/schema.prisma");
  const migration = await readProjectFile("prisma/migrations/202607220002_add_email_notifications/migration.sql");
  assert.match(schema, /model NotificationPreferences/);
  assert.match(schema, /userId\s+String\s+@unique/);
  assert.match(schema, /model EmailDelivery/);
  assert.match(schema, /dedupeKey\s+String\s+@unique/);
  assert.match(migration, /CREATE TABLE "NotificationPreferences"/);
  assert.match(migration, /CREATE TABLE "EmailDelivery"/);
});
~~~

- [ ] **Step 2: Run the test to verify it fails**

Run: node --import tsx --test tests/notification-preferences.test.mts

Expected: FAIL because the models and migration do not exist.

- [ ] **Step 3: Implement the minimal schema and SQLite migration**

Add NotificationPreferences with defaults of false for the master switch and six fields: limitApproachingEnabled, limitExceededEnabled, stakeIncreaseEnabled, lossStreakEnabled, highFrequencyEnabled, and pauseRecommendedEnabled. Add EmailDelivery with unique dedupeKey, user/alert relations and user/alert indexes. Add matching inverse relations, then create exact SQLite tables, foreign keys and indexes in the migration.

- [ ] **Step 4: Generate and verify**

Run: npx prisma generate && node --import tsx --test tests/notification-preferences.test.mts

Expected: PASS.

- [ ] **Step 5: Commit**

~~~bash
git add prisma/schema.prisma prisma/migrations/202607220002_add_email_notifications/migration.sql tests/notification-preferences.test.mts
git commit -m "Add email notification persistence"
~~~

## Task 2: Implement the Resend adapter and delivery ledger

**Files:**
- Modify: package.json, package-lock.json, .env.example
- Create: src/lib/email/email-config.ts, src/lib/email/email-client.ts, src/lib/email/email-templates.ts, src/lib/email/email-delivery.ts
- Create: tests/email-config.test.mts, tests/email-delivery.test.mts

**Interfaces:**
- getEmailConfiguration(environment?) returns configured Resend provider data or null.
- EmailClient.send(input) returns a provider message id.
- EmailDeliveryService has sendWelcome, sendPasswordReset and sendResponsibleGamingAlert; each returns a delivery outcome and never throws provider failures.

- [ ] **Step 1: Write failing configuration and failure-isolation tests**

~~~ts
test("email config requires resend, key, and sender", () => {
  assert.equal(getEmailConfiguration({ EMAIL_PROVIDER: "resend", RESEND_API_KEY: "", EMAIL_FROM: "StakeControl <no-reply@notify.getstakecontrol.com>" }), null);
  assert.equal(getEmailConfiguration({ EMAIL_PROVIDER: "resend", RESEND_API_KEY: "re_test", EMAIL_FROM: "StakeControl <no-reply@notify.getstakecontrol.com>" })?.provider, "resend");
});

test("failed provider delivery is persisted without rejecting", async () => {
  const service = new EmailDeliveryService({ client: { send: async () => { throw new Error("provider down"); } }, repository });
  const result = await service.sendWelcome({ userId: "user-1", email: "person@example.com", name: "Ada" });
  assert.equal(result.delivered, false);
  assert.equal(repository.updated.status, "failed");
});
~~~

- [ ] **Step 2: Run tests to verify failure**

Run: node --import tsx --test tests/email-config.test.mts tests/email-delivery.test.mts

Expected: FAIL because adapter modules do not exist.

- [ ] **Step 3: Implement the adapter**

Run: npm install resend.

Create a narrow SDK client using resend.emails.send with sender, recipient array, subject, HTML and text. Validate provider, nonblank key and nonblank sender. Escape dynamic template values. Insert pending deliveries with deterministic keys welcome:userId, password-reset:sha256(token), and responsible-alert:alertId; skip existing keys. Update to sent with provider id or failed with a safe bounded message.

- [ ] **Step 4: Run focused tests**

Run: node --import tsx --test tests/email-config.test.mts tests/email-delivery.test.mts

Expected: PASS.

- [ ] **Step 5: Commit**

~~~bash
git add package.json package-lock.json .env.example src/lib/email tests/email-config.test.mts tests/email-delivery.test.mts
git commit -m "Add Resend email delivery adapter"
~~~

## Task 3: Wire password recovery and welcome mail

**Files:**
- Modify: src/lib/password-recovery-actions.ts, src/lib/auth-actions.ts, tests/password-recovery.test.mts
- Create: tests/welcome-email.test.mts

**Interfaces:**
- Consume sendPasswordReset with user, email, reset URL and token, and sendWelcome with user, email and name.
- Preserve existing password-reset copy and registration redirect.

- [ ] **Step 1: Write failing boundary tests**

~~~ts
test("password recovery keeps its generic response while dispatching a reset link", async () => {
  const result = await requestPasswordResetAction({}, formDataFor({ email: "person@example.com" }));
  assert.equal(result.success, "Si existe una cuenta para ese correo, recibirás instrucciones para restablecer tu contraseña.");
  assert.match(delivery.calls[0].resetUrl, /\/reset-password\?token=/);
});

test("registration schedules a single welcome delivery after creating the user", async () => {
  await registerAction({}, validRegistrationFormData());
  assert.equal(delivery.calls.length, 1);
  assert.equal(delivery.calls[0].userId, createdUser.id);
});
~~~

- [ ] **Step 2: Run tests to verify failure**

Run: node --import tsx --test tests/password-recovery.test.mts tests/welcome-email.test.mts

Expected: FAIL because recovery has a stub and registration does not dispatch mail.

- [ ] **Step 3: Wire the adapter as best effort**

Replace deliverPasswordResetEmail with the delivery service and swallow/log only safe failures. After prisma.user.create, dispatch welcome mail before session creation through a best-effort helper. Do not alter the redirect or let mail failure prevent the account.

- [ ] **Step 4: Verify and commit**

Run: node --import tsx --test tests/password-recovery.test.mts tests/welcome-email.test.mts

Expected: PASS.

~~~bash
git add src/lib/password-recovery-actions.ts src/lib/auth-actions.ts tests/password-recovery.test.mts tests/welcome-email.test.mts
git commit -m "Send recovery and welcome emails"
~~~

## Task 4: Add onboarding consent and individual settings

**Files:**
- Create: src/lib/notification-preferences.ts, src/components/settings/EmailNotificationPreferencesForm.tsx, tests/notification-preferences-actions.test.mts
- Modify: src/lib/auth-actions.ts, src/lib/settings-actions.ts, src/app/onboarding/page.tsx, src/components/auth/OnboardingForm.tsx, src/app/settings/page.tsx

**Interfaces:**
- ALERT_EMAIL_PREFERENCES maps all six AlertType values to a field and Spanish label.
- buildNotificationPreferences(consent) and isAlertEmailEnabled(preferences, type).
- updateEmailNotificationPreferencesAction only updates the authenticated user's row.

- [ ] **Step 1: Write failing preference tests**

~~~ts
test("onboarding opt-in enables every current alert type", () => {
  assert.equal(buildNotificationPreferences(true).lossStreakEnabled, true);
  assert.equal(buildNotificationPreferences(true).pauseRecommendedEnabled, true);
});
test("an individually disabled type blocks only that email", () => {
  assert.equal(isAlertEmailEnabled({ ...buildNotificationPreferences(true), lossStreakEnabled: false }, "LOSS_STREAK"), false);
  assert.equal(isAlertEmailEnabled(buildNotificationPreferences(true), "LIMIT_EXCEEDED"), true);
});
~~~

- [ ] **Step 2: Run test to verify failure**

Run: node --import tsx --test tests/notification-preferences-actions.test.mts

Expected: FAIL because mapping and functions do not exist.

- [ ] **Step 3: Implement actions and controls**

Extend onboarding validation with emailAlertsEnabled, then upsert all preference fields inside its existing transaction. Add the checkbox “Quiero recibir alertas preventivas por email” and state it can be changed later. Add a settings section with master switch plus six labelled checkboxes. Persist with a Zod-validated, authenticated server action; retain individual choices when master switch is off.

- [ ] **Step 4: Verify and commit**

Run: node --import tsx --test tests/notification-preferences.test.mts tests/notification-preferences-actions.test.mts

Expected: PASS.

~~~bash
git add src/lib/notification-preferences.ts src/lib/auth-actions.ts src/lib/settings-actions.ts src/app/onboarding/page.tsx src/components/auth/OnboardingForm.tsx src/app/settings/page.tsx src/components/settings/EmailNotificationPreferencesForm.tsx tests/notification-preferences-actions.test.mts
git commit -m "Add email alert preferences"
~~~

## Task 5: Send only new opted-in responsible-gaming alerts

**Files:**
- Modify: src/lib/responsible-gaming.ts
- Create: tests/responsible-gaming-email.test.mts

**Interfaces:**
- ensureAlertForWindow returns alert plus a boolean showing whether it inserted the row.
- evaluateResponsibleGamingAlerts keeps current alert behavior but dispatches email only for newly created alert rows passing isAlertEmailEnabled.

- [ ] **Step 1: Write failing delivery/deduplication tests**

~~~ts
test("a newly created opted-in limit alert schedules one email", async () => {
  await evaluateResponsibleGamingAlerts("user-1");
  assert.equal(delivery.calls.length, 1);
  assert.equal(delivery.calls[0].alert.type, "LIMIT_EXCEEDED");
});

test("existing alerts and disabled preferences send no extra mail", async () => {
  await evaluateResponsibleGamingAlerts("user-1");
  await evaluateResponsibleGamingAlerts("user-1");
  assert.equal(delivery.calls.length, 1);
});
~~~

- [ ] **Step 2: Run test to verify failure**

Run: node --import tsx --test tests/responsible-gaming-email.test.mts

Expected: FAIL because alert evaluation does not dispatch email.

- [ ] **Step 3: Implement best-effort dispatch**

Preserve existing dedupe windows. Track which ensureAlertForWindow calls inserted a row, then after persistence use Promise.allSettled to deliver only those new rows with active preferences. Keep all delivery outside Prisma transactions and log generic failures.

- [ ] **Step 4: Verify and commit**

Run: node --import tsx --test tests/responsible-gaming-email.test.mts

Expected: PASS.

~~~bash
git add src/lib/responsible-gaming.ts tests/responsible-gaming-email.test.mts
git commit -m "Deliver opted-in responsible gaming alerts"
~~~

## Task 6: Verify, migrate, deploy, and prove production

**Files:** none unless a verification failure requires a focused fix.

- [ ] **Step 1: Run complete checks**

Run: npm test && npm run typecheck && npm run build && git diff --check

Expected: all tests pass, typecheck passes, build succeeds, and diff check is clean.

- [ ] **Step 2: Apply only the new migration to Turso**

Use @libsql/client with DATABASE_URL and TURSO_AUTH_TOKEN to execute exactly the new migration. Query sqlite_master afterward to verify both new tables and indexes. Do not print credentials or run unrelated migrations.

- [ ] **Step 3: Push and deploy**

~~~bash
git push origin main
vercel --prod --yes
vercel inspect PRODUCTION_URL
~~~

Expected: main push succeeds, deployment is Ready, and app.getstakecontrol.com remains reachable.

- [ ] **Step 4: Controlled production proof**

Use a dedicated test account that opted into alerts, trigger one deduplicated alert, and confirm the corresponding EmailDelivery becomes sent with a provider message id. Do not send test mail to arbitrary users or expose recipient data.

