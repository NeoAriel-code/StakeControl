# Private Product Analytics Design

## Goal

Measure whether the StakeControl beta is useful through privacy-preserving product-usage events, without transmitting betting, ticket, account, or user-content data to the analytics provider.

## Scope

### Provider and activation

- Use PostHog Cloud through its official browser SDK.
- The analytics client is optional: it is not initialized and sends no requests when `NEXT_PUBLIC_POSTHOG_KEY` is absent.
- Analytics requires an explicit, revocable user consent. Until consent is granted, StakeControl must not initialize PostHog, create an analytics identifier, write PostHog cookies, or capture events.
- Store the consent choice locally in the browser. A signed-in user can withdraw it from the settings experience; withdrawal disables capture, clears PostHog state, and prevents later initialization unless consent is granted again.
- Set `autocapture: false`, disable session recording, disable person profiles, and do not call `identify`, `alias`, person-property APIs, or automatic page-view APIs.
- Do not proxy events through the application server. The browser sends the approved events to PostHog only after consent.

### Closed event catalog

The analytics module is the only code allowed to call the PostHog SDK. It exports a typed event name and event-property contract; application code cannot pass arbitrary event names or properties.

The permitted events are:

- `account_created`
- `email_verified`
- `onboarding_completed`
- `first_manual_bet_created`
- `ticket_upload_started`
- `ticket_completed`
- `ticket_ocr_failed`
- `ticket_review_completed`
- `ticket_saved`
- `limit_configured`
- `pause_activated`
- `alert_viewed`
- `csv_exported`
- `feedback_submitted`
- `account_deleted`

No page views, click autocapture, session recordings, error payloads, user profiles, or feature-flag traffic are in scope.

### Permitted properties

Events may have no properties. The only permitted properties, limited to the event where they are meaningful, are:

- `ocr_provider`: fixed provider identifier, such as `google_vision`.
- `ai_model`: a configured model identifier only; it never contains prompt, response, ticket, or account content.
- `processing_duration_ms`: non-negative integer duration.
- `manual_corrections_count`: non-negative integer count.
- `confidence_band`: one of `low`, `medium`, or `high`.
- `file_type`: one of `png`, `jpg`, or `webp`.

The provider must never receive these prohibited fields, whether as event properties, identifiers, URLs, error metadata, or profile data:

- Stakes, profit/loss, sportsbook, selection, market, odds, bet dates, ticket codes, raw OCR text, ticket image/file references, health answers, limits, alerts, exported rows, or any other betting record.
- Email address, name, internal user ID, IP-derived custom data, authentication token, cookie value, password, reset token, or other account identifier.
- Query strings, pathname-derived identifiers, free-form feedback, uploaded-file names, exception messages, prompt/response text, or request bodies.

## User experience and privacy policy

- Present a concise analytics-consent prompt only after the app is usable, explaining that optional usage analytics helps improve the beta and does not include betting or ticket data. It has an accept action and a decline action with equal access.
- Do not block core product access when the user declines.
- Add a settings control showing the current analytics state and allowing revocation. A revoked choice remains opted out until the user opts in again.
- Update the privacy page to name PostHog as an optional analytics provider and explicitly describe the closed category of operational usage data sent after consent. It must state that betting records, ticket contents, financial values, and direct account identifiers are not sent for analytics.

## Architecture

Add a client-only analytics module with four independent responsibilities:

1. `analytics-consent` reads, writes, and clears the local consent state without accessing PostHog.
2. `product-analytics` defines the closed event union and property map, initializes the SDK only after consent, and captures an approved event only when the client is available.
3. A small client consent UI presents the prompt and settings control, then calls the consent module and analytics lifecycle methods.
4. Feature actions call named analytics helpers after successful completion. They pass only the approved primitive values needed for their corresponding event.

The root layout mounts the consent UI without affecting server rendering. Existing server actions and Sentry operational telemetry remain separate from product analytics. Product analytics never receives Sentry events, errors, or user context.

## Environment

- `NEXT_PUBLIC_POSTHOG_KEY`: public PostHog project API key. Its absence disables product analytics.
- `NEXT_PUBLIC_POSTHOG_HOST`: optional PostHog ingestion host; default to the official cloud host when the key exists.

Both values are public browser configuration, not authentication credentials. PostHog project configuration must also keep session recording and autocapture disabled.

## Event instrumentation

- Account and onboarding events are emitted only after their existing successful persistence flows complete.
- Ticket upload, OCR, review, and save events are emitted from the client interaction paths after the corresponding success/failure outcome is known. OCR failure is categorized without its raw error.
- `first_manual_bet_created` is emitted only when the product has determined the newly saved bet is the account's first manually created bet; it sends no bet details.
- Limits, pauses, alert views, CSV export, feedback submission, and account deletion are emitted only after their user-visible action succeeds.
- The implementation must avoid duplicate capture caused by React rerenders, page transitions, or a repeated submit attempt.

## Error handling

- A missing key, failed SDK initialization, rejected capture promise, unavailable browser storage, or an analytics network failure must be a no-op for the product user; it must not interrupt the action that produced the event.
- Never route analytics errors to PostHog, Sentry, or the UI with the original event payload. Development-only diagnostics may use a fixed non-sensitive message.

## Verification

- Unit tests prove that the event type contract accepts every listed event and only the allowed property values.
- Unit tests prove no capture or PostHog initialization occurs before consent or when the public key is missing.
- Unit tests prove revocation clears analytics state and blocks later capture.
- Static tests verify the privacy page declares optional PostHog analytics and the explicit exclusions.
- Focused tests cover each instrumented feature with a fake analytics helper and assert the exact event and permitted properties only.
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` after implementation.
- Manually inspect a PostHog test event after explicit consent to verify it contains only its event name and approved properties.

## Out of scope

- Analytics dashboards, feature flags, A/B tests, surveys, session replay, error tracking, user profiles, and data exports from PostHog.
- Server-side analytics, analytics storage in Prisma, retrospective analysis of existing records, and any attempt to reconstruct betting behavior.
- Changes to Sentry configuration or its privacy filter, except keeping its responsibilities distinct from product analytics.
