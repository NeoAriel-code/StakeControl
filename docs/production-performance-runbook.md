# Production performance release

## Preview gate

Use a QA account containing at least 100,000 bets and provide its complete session cookie only through the environment. Run:

```bash
PREVIEW_BASE_URL=https://preview.example \
QA_SESSION_COOKIE='stakecontrol_session=...' \
k6 run performance/k6-production.js
```

The gate is 250 virtual users, p95 below 500 ms, p99 below 1 s, application errors below 1%, database-operation p95 below 200 ms, and no connection errors. The database threshold is populated when the preview exposes a private `Server-Timing: db;dur=...` measurement; absence of samples must be checked in the k6 summary and in Sentry before approval.

Measure round-trip time from the deployed preview region to the Turso endpoint and compare available Vercel compute regions before choosing the production region. Do not print the database token:

```bash
curl --silent --output /dev/null --write-out '%{time_connect} %{time_starttransfer}\n' "$DATABASE_HTTP_HEALTH_URL"
```

## Migration and deployment

1. Create and verify a Turso backup immediately before migration.
2. Run the managed production migration and verify these names in `sqlite_master`: `Bet_userId_result_placedAt_idx`, `ResponsibleGamingAlert_userId_acknowledgedAt_createdAt_idx`, `Subscription_userId_status_createdAt_idx`, and `ProductFeedback_reviewStatus_createdAt_idx`.
3. Deploy only after the full test, lint, typecheck, build, query-plan, and k6 gates pass.
4. Observe p95/p99 route and database latency, errors, cold starts, Turso failures, and Sentry spans for at least 30 minutes.
5. Block or roll back the application release if any budget is exceeded. Keep the additive indexes during rollback; remove them only in a separate reviewed migration.
