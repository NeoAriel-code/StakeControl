# Private Product Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Add consent-gated PostHog product analytics with a closed, privacy-safe event catalog and no betting data.

**Architecture:** A browser-only façade owns consent, PostHog initialization, the typed event catalog, and revocation. Client controls report only after success; redirecting server actions pass a fixed event through a one-time browser handoff. The provider never receives account identity, URLs, user content, betting data, or Sentry telemetry.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, PostHog JS, Node test runner with tsx.

## Global Constraints

- Use \`posthog-js\` only; do not add server-side PostHog, profiles, feature flags, recordings, or a Prisma analytics model.
- No initialization, cookies, network requests, or events before browser-local affirmative consent.
- Use \`autocapture: false\`, \`capture_pageview: false\`, \`disable_session_recording: true\`, and \`person_profiles: "never"\`.
- Only \`src/lib/analytics/product-analytics.ts\` imports PostHog and invokes capture.
- Allowed events: \`account_created\`, \`email_verified\`, \`onboarding_completed\`, \`first_manual_bet_created\`, \`ticket_upload_started\`, \`ticket_completed\`, \`ticket_ocr_failed\`, \`ticket_review_completed\`, \`ticket_saved\`, \`limit_configured\`, \`pause_activated\`, \`alert_viewed\`, \`csv_exported\`, \`feedback_submitted\`, \`account_deleted\`.
- Allowed properties only: \`ocr_provider\`, \`ai_model\`, \`processing_duration_ms\`, \`manual_corrections_count\`, \`confidence_band\`, \`file_type\`.
- Never capture bet, ticket, OCR, file, account, URL/query-string, free-text, error, authentication, or request-body values.
- \`feedback_submitted\` stays defined but is not emitted: the product has no feedback feature and this plan does not create one.

---

### Task 1: Add consent persistence and the closed analytics façade

**Files:**
- Modify: \`package.json\`, \`package-lock.json\`
- Create: \`src/lib/analytics/analytics-consent.ts\`
- Create: \`src/lib/analytics/product-analytics.ts\`
- Test: \`tests/analytics-consent.test.mts\`, \`tests/product-analytics.test.mts\`

**Interfaces:**
- \`type AnalyticsConsent = "granted" | "denied" | null\`
- \`getAnalyticsConsent(): AnalyticsConsent\`, \`setAnalyticsConsent(value): void\`, \`clearAnalyticsConsent(): void\`
- \`captureProductEvent(event, properties?): void\`, \`enableProductAnalytics(): void\`, \`disableProductAnalytics(): void\`

- [ ] **Step 1: Write the failing storage and initialization tests**

\`\`\`ts
test("analytics remains inactive without consent or a public key", async () => {
  const calls: unknown[] = [];
  const analytics = await loadAnalytics({ key: undefined, consent: null, calls });
  analytics.captureProductEvent("ticket_upload_started", { file_type: "png" });
  assert.deepEqual(calls, []);
});

test("analytics initializes with private options and captures an allowed event", async () => {
  const calls: unknown[] = [];
  const analytics = await loadAnalytics({ key: "phc_test", consent: "granted", calls });
  analytics.enableProductAnalytics();
  analytics.captureProductEvent("ticket_completed", {
    ocr_provider: "google_vision",
    ai_model: "gpt-4.1-mini",
    processing_duration_ms: 920,
    confidence_band: "high",
    file_type: "jpg",
  });
  assert.equal(calls.length, 2);
});
\`\`\`

- [ ] **Step 2: Run the focused tests and verify RED**

Run: \`npm test -- tests/analytics-consent.test.mts tests/product-analytics.test.mts\`

Expected: FAIL because the consent and façade modules do not exist.

- [ ] **Step 3: Install the dependency and implement the modules**

Run: \`npm install posthog-js\`

Implement safe \`localStorage\` access under the fixed key \`stakecontrol.analytics-consent\`; unavailable storage returns no consent. Export this exact closed contract:

\`\`\`ts
export type ProductAnalyticsEvent =
  | "account_created" | "email_verified" | "onboarding_completed"
  | "first_manual_bet_created" | "ticket_upload_started" | "ticket_completed"
  | "ticket_ocr_failed" | "ticket_review_completed" | "ticket_saved"
  | "limit_configured" | "pause_activated" | "alert_viewed"
  | "csv_exported" | "feedback_submitted" | "account_deleted";

export type ProductAnalyticsProperties = Partial<{
  ocr_provider: "google_vision" | "mock" | "aws_textract" | "azure_vision" | "tesseract";
  ai_model: string;
  processing_duration_ms: number;
  manual_corrections_count: number;
  confidence_band: "low" | "medium" | "high";
  file_type: "png" | "jpg" | "webp";
}>;
\`\`\`

Initialize once only when both key and granted consent exist. Validate non-negative finite numeric properties before \`capture\`; catch all SDK/storage errors. Revocation must call \`reset\`, opt out of capture, and discard the module reference.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: \`npm test -- tests/analytics-consent.test.mts tests/product-analytics.test.mts\`

Expected: PASS.

- [ ] **Step 5: Commit**

\`\`\`bash
git add package.json package-lock.json src/lib/analytics tests/analytics-consent.test.mts tests/product-analytics.test.mts
git commit -m "feat: add private analytics facade"
\`\`\`

### Task 2: Add consent UI, revocation control, and policy disclosure

**Files:**
- Create: \`src/components/analytics/AnalyticsConsent.tsx\`
- Create: \`src/components/settings/AnalyticsPreferences.tsx\`
- Modify: \`src/app/layout.tsx\`, \`src/app/settings/page.tsx\`, \`src/app/privacy/page.tsx\`
- Test: \`tests/analytics-privacy.test.mts\`

**Interfaces:** the root client component calls Task 1 methods; the settings card exposes Activate/Deactivate actions.

- [ ] **Step 1: Write failing UI/privacy assertions**

\`\`\`ts
test("privacy policy declares consented PostHog analytics and exclusions", async () => {
  const source = await readFile(new URL("../src/app/privacy/page.tsx", import.meta.url), "utf8");
  assert.match(source, /PostHog/);
  assert.match(source, /consentimiento/);
  assert.match(source, /no enviamos.*apuestas.*tickets.*identificadores/i);
});

test("root layout mounts the analytics consent component", async () => {
  const source = await readFile(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
  assert.match(source, /AnalyticsConsent/);
});
\`\`\`

- [ ] **Step 2: Run RED**

Run: \`npm test -- tests/analytics-privacy.test.mts\`

Expected: FAIL.

- [ ] **Step 3: Implement non-blocking, equal-choice consent**

Mount \`<AnalyticsConsent />\` beside \`<BetaBadge />\`. If the public key is absent, render nothing. If consent is absent, render a compact accessible notice after the app has loaded with equally prominent “Aceptar” and “No aceptar” actions; declining does not block any product function. Existing granted consent enables the façade on mount. The settings card shows active/inactive state and calls Task 1 to opt in or revoke.

Replace the privacy page’s future-tense analytics text with PostHog disclosure: only consented event names and the approved technical categories are sent; betting records, ticket contents, financial values, and direct account identifiers are excluded.

- [ ] **Step 4: Run GREEN and commit**

Run: \`npm test -- tests/analytics-privacy.test.mts\`

\`\`\`bash
git add src/components/analytics src/components/settings/AnalyticsPreferences.tsx src/app/layout.tsx src/app/settings/page.tsx src/app/privacy/page.tsx tests/analytics-privacy.test.mts
git commit -m "feat: add analytics consent controls"
\`\`\`

### Task 3: Add a redirect-safe, one-time event handoff

**Files:**
- Create: \`src/lib/analytics/analytics-handoff.ts\`
- Modify: \`src/components/analytics/AnalyticsConsent.tsx\`
- Test: \`tests/product-analytics.test.mts\`

**Interfaces:** \`queueAnalyticsEvent(event, properties?): void\` and \`drainQueuedAnalyticsEvent(capture): void\`, constrained by Task 1 types.

- [ ] **Step 1: Write the failing one-time drain test**

\`\`\`ts
test("a redirect event is captured once then removed", () => {
  const events: unknown[] = [];
  queueAnalyticsEvent("ticket_saved", { manual_corrections_count: 2 });
  drainQueuedAnalyticsEvent((event, properties) => events.push([event, properties]));
  drainQueuedAnalyticsEvent((event, properties) => events.push([event, properties]));
  assert.deepEqual(events, [["ticket_saved", { manual_corrections_count: 2 }]]);
});
\`\`\`

- [ ] **Step 2: Run RED**

Run: \`npm test -- tests/product-analytics.test.mts\`

Expected: FAIL.

- [ ] **Step 3: Implement the fixed-record session handoff**

Persist one validated \`{ event, properties }\` record under \`stakecontrol.analytics-pending-event\` in \`sessionStorage\`; no identifiers or dynamic URLs. Drain removes before invoking capture, does nothing without granted consent, and catches malformed JSON/storage failures. The root consent component drains once after startup/opt-in.

- [ ] **Step 4: Run GREEN and commit**

Run: \`npm test -- tests/product-analytics.test.mts\`

\`\`\`bash
git add src/lib/analytics/analytics-handoff.ts src/components/analytics/AnalyticsConsent.tsx tests/product-analytics.test.mts
git commit -m "feat: preserve analytics events across redirects"
\`\`\`

### Task 4: Instrument ticket flow with only technical metadata

**Files:**
- Modify: \`src/components/tickets/TicketUploadForm.tsx\`, \`src/components/tickets/TicketReviewForm.tsx\`, \`src/lib/ticket-actions.ts\`
- Test: \`tests/product-analytics.test.mts\`

**Interfaces:** upload form captures \`ticket_upload_started\`; redirect handoff reports completion/failure/review/save after their actual outcome.

- [ ] **Step 1: Write failing ticket privacy tests**

\`\`\`ts
test("ticket flow has only approved analytics properties", async () => {
  const source = await readFile(new URL("../src/lib/ticket-actions.ts", import.meta.url), "utf8");
  assert.match(source, /ticket_completed/);
  assert.match(source, /ticket_ocr_failed/);
  assert.doesNotMatch(source, /captureProductEvent\\([^\\n]+rawText|fileName|imageUrl|ticketCode/);
});
\`\`\`

- [ ] **Step 2: Run RED**

Run: \`npm test -- tests/product-analytics.test.mts\`

Expected: FAIL.

- [ ] **Step 3: Implement success/failure boundaries**

Normalize MIME type to \`png | jpg | webp\`. Capture \`ticket_upload_started\` immediately before a valid submit. Measure only duration in the action. On successful OCR/AI completion, hand off \`ticket_completed\` with provider, model, duration, confidence band, and file type. On OCR failure, hand off \`ticket_ocr_failed\` with provider/duration/file type and never the error. After successful human review, hand off both \`ticket_review_completed\` and \`ticket_saved\`, with correction count and confidence band only. Do not include ticket ID, filename, stored reference, raw OCR, extracted fields, or user-entered edits.

- [ ] **Step 4: Run GREEN and commit**

Run: \`npm test -- tests/product-analytics.test.mts\`

\`\`\`bash
git add src/components/tickets/TicketUploadForm.tsx src/components/tickets/TicketReviewForm.tsx src/lib/ticket-actions.ts tests/product-analytics.test.mts
git commit -m "feat: track private ticket workflow events"
\`\`\`

### Task 5: Instrument account, responsible-use, export, and deletion events

**Files:**
- Modify: \`src/components/auth/RegisterForm.tsx\`, \`src/components/auth/OnboardingForm.tsx\`, \`src/components/bets/BetForm.tsx\`, \`src/components/limits/LimitsForm.tsx\`, \`src/components/auth/DeleteAccountForm.tsx\`
- Modify: \`src/app/verify-email/page.tsx\`, \`src/app/alerts/page.tsx\`, \`src/app/reports/export/page.tsx\`
- Modify: \`src/lib/auth-actions.ts\`, \`src/lib/bet-actions.ts\`, \`src/lib/limit-actions.ts\`, \`src/lib/alert-actions.ts\`
- Test: \`tests/product-analytics.test.mts\`

**Interfaces:** client components capture no-property events only after confirmed success; server actions do not import PostHog.

- [ ] **Step 1: Write failing closed-catalog assertions**

\`\`\`ts
test("responsible-use sources reference no betting or account values in analytics calls", async () => {
  const source = await readFile(new URL("../src/components/bets/BetForm.tsx", import.meta.url), "utf8");
  assert.match(source, /first_manual_bet_created/);
  assert.doesNotMatch(source, /captureProductEvent\\([^\\n]+stake|profit|sportsbook|selection|market|odds/);
});
\`\`\`

- [ ] **Step 2: Run RED**

Run: \`npm test -- tests/product-analytics.test.mts\`

Expected: FAIL.

- [ ] **Step 3: Instrument only completed actions**

Capture or hand off these no-property events after success: registration \`account_created\`; verification view \`email_verified\`; onboarding \`onboarding_completed\`; confirmed first manual-bet creation \`first_manual_bet_created\`; limits upsert \`limit_configured\`; a transition from no pause to active pause \`pause_activated\`; acknowledgment of an unread alert \`alert_viewed\`; successful CSV response start \`csv_exported\`; and confirmed account deletion \`account_deleted\`.

For existing redirecting forms, return a success state then navigate client-side after queueing, preserving current paths. CSV must move its submit interaction into a client component so it can capture only after a successful response header, without sending date parameters. Deletion must return a success state after database/session deletion so the client can capture without an account ID before navigating to login. Do not capture validation errors, page views, updates, form values, URLs, or feedback text.

- [ ] **Step 4: Run GREEN and commit**

Run: \`npm test -- tests/product-analytics.test.mts\`

\`\`\`bash
git add src/components/auth/RegisterForm.tsx src/components/auth/OnboardingForm.tsx src/components/bets/BetForm.tsx src/components/limits/LimitsForm.tsx src/components/auth/DeleteAccountForm.tsx src/app/verify-email/page.tsx src/app/alerts/page.tsx src/app/reports/export/page.tsx src/lib/auth-actions.ts src/lib/bet-actions.ts src/lib/limit-actions.ts src/lib/alert-actions.ts tests/product-analytics.test.mts
git commit -m "feat: track private product usage events"
\`\`\`

### Task 6: Lock down the integration and verify it

**Files:**
- Modify: \`README.md\`, \`tests/product-analytics.test.mts\`

- [ ] **Step 1: Write the failing import-boundary test**

\`\`\`ts
test("only the analytics facade imports posthog-js", async () => {
  const files = await glob("src/**/*.{ts,tsx}");
  const importedBy = (await Promise.all(files.map(async (file) => [file, await readFile(file, "utf8")] as const)))
    .filter(([, source]) => source.includes("posthog-js"))
    .map(([file]) => file);
  assert.deepEqual(importedBy, ["src/lib/analytics/product-analytics.ts"]);
});
\`\`\`

- [ ] **Step 2: Run RED**

Run: \`npm test -- tests/product-analytics.test.mts\`

Expected: FAIL until the dependency boundary is complete.

- [ ] **Step 3: Document configuration**

Add a README section for \`NEXT_PUBLIC_POSTHOG_KEY\` and optional \`NEXT_PUBLIC_POSTHOG_HOST\`. State these are public configuration, consent is required, and PostHog project settings must keep autocapture and Session Replay disabled. Do not add a key to source control.

- [ ] **Step 4: Run complete verification**

Run:

\`\`\`bash
npm run lint
npm run typecheck
npm test
npm run build
\`\`\`

Expected: all commands exit 0. In a PostHog test project, opt in and inspect one event: it must contain only an approved event name/properties and no person profile.

- [ ] **Step 5: Commit**

\`\`\`bash
git add README.md tests/product-analytics.test.mts
git commit -m "docs: document private product analytics"
\`\`\`

