# Beta and Observability Design

## Goal

Make StakeControl's beta status explicit, prevent public payment expectations, collect versioned beta consent, and add privacy-preserving error and availability monitoring before inviting testers.

## Scope

### Beta consent and product communication

- Display a discrete, persistent `StakeControl Beta` label in the signed-in application and public experience.
- Add a required beta notice and acceptance control to onboarding. The notice explains that ticket reading, calculations and availability can fail; extracted data must be reviewed; AI does not diagnose; users may report errors and request data deletion.
- Add `betaTermsAcceptedAt DateTime?` and `betaTermsVersion String?` to `User`.
- Use the fixed initial version `beta-2026-07-23`.
- Require existing authenticated users whose stored version differs from the current version to accept the beta terms before entering protected application pages. New users accept within onboarding.

### Premium beta public positioning

- Replace public pricing and commercial calls to action with:
  - `Premium Beta`
  - `Disponible para participantes seleccionados`
  - `Sin cobro durante el período de prueba`
- Do not alter current internal plan-testing controls, authorization, or feature gates; those are not a payment system.

### Sentry observability and privacy

- Integrate the official `@sentry/nextjs` SDK for browser, Node and Edge Next.js runtimes.
- Capture unhandled client/server errors, Next request errors and explicitly report handled failures in login, OCR, OpenAI, bet persistence, exports and transactional email delivery.
- Use a deterministic one-way hash of the internal user ID as the sole user identifier sent to Sentry.
- Configure `beforeSend` and request/event normalization to remove or redact email addresses, tokens, authorization/cookie headers, request bodies, OCR text, image references, ticket codes, bet data, responsible-gaming answers and attachment data.
- Do not send raw exception metadata that might include an email or token; use bounded error categories for controlled reporting.
- Configure Sentry alert delivery initially to `hola@getstakecontrol.com`.

### Uptime

- Configure two Sentry Uptime monitors through the Sentry project UI after the project exists:
  - `https://getstakecontrol.com`
  - `https://getstakecontrol.com/api/health`
- Use HTTP GET and alert the same temporary mailbox.

## Architecture

`beta-terms.ts` defines the current version and determines whether a user needs consent. Auth middleware/server-side user access redirects unaccepted accounts to a dedicated consent page, while onboarding collects and persists initial acceptance atomically with its existing confirmations. The label is a reusable presentational component.

Sentry configuration is isolated in runtime configuration files plus a shared privacy-scrubbing module. The application code reports only defined failure categories and hashes user IDs before setting Sentry user context. The DSN is a public ingest identifier, while the auth token remains server-only and is used only for source-map upload during builds.

## Environment Variables

- `NEXT_PUBLIC_SENTRY_DSN`: browser/runtime ingest DSN. It is public by design and contains no credentials with write authority.
- `SENTRY_DSN`: server ingest DSN when a separate server DSN is used; otherwise the server configuration may use the public DSN.
- `SENTRY_AUTH_TOKEN`: server-only build token for source-map upload.
- `SENTRY_ORG`, `SENTRY_PROJECT`: non-secret build metadata.
- `SENTRY_ENVIRONMENT`: explicit environment label, defaulting to `production` only in production.

## Failure Categories

The integration records categories such as `auth.login_failed`, `ocr.failed`, `ai.failed`, `bet.persistence_failed`, `export.failed`, `email.delivery_failed`, and `timeout`. It does not attach operation payloads.

## Verification

- Unit tests for beta-version gating, acceptance persistence contract and public Premium copy.
- Static/privacy tests proving Sentry filtering removes sensitive request and user fields.
- Tests for error-category capture helpers without payload data.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- Manual Sentry verification after DSN setup: trigger a synthetic safe error and confirm it contains an anonymous user ID only.
- Configure the two Uptime monitors in Sentry and confirm their first successful checks.

## Out of Scope

- Payments, billing, refunds or public Premium purchase.
- Changing plan-test authorization or feature entitlement logic.
- Automated Sentry-account provisioning; it requires the user's Sentry organization access.
