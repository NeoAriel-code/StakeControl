# Account Email Security Design

## Goal

Require email verification before a registered account can access StakeControl or consume Free-plan ticket capacity, while completing the essential transactional security emails.

## Current State

- Registration immediately creates a session and sends a welcome email; email ownership is not verified.
- Password recovery uses a random 32-byte token, stores only its SHA-256 hash, expires after one hour, and consumes the token atomically before updating the password.
- The configured production sender is `StakeControl <no-reply@notify.getstakecontrol.com>` and every reply is routed to `support@getstakecontrol.com` through Resend's `replyTo`.
- Password changes do not trigger an email notification.

## Design

### Verification gate

Add `emailVerifiedAt` to `User` and a `EmailVerificationToken` model that stores the user id, unique SHA-256 token hash, expiry, used timestamp, and creation time. Registration creates the user unverified, creates an opaque 32-byte verification token, sends the verification message, and does not create an authenticated session.

Only a valid verification link sets `emailVerifiedAt` and then creates the initial session. A user who attempts to log in while unverified receives a generic confirmation-needed message and a controlled option to resend the link. All authenticated routes continue to require an established session, so unverified accounts cannot upload tickets, invoke OCR, or consume plan allowances.

Verification links expire after 24 hours and are single use. Generating a new link invalidates any prior unused verification token for that user. Token values never enter the database or logs.

### Anti-abuse limits

Reuse the existing rate-limit storage to limit registration, verification-email resend, and password-reset requests by normalized email. Registration and resend allow three attempts per hour; password reset allows three requests per hour. Limits return a generic retry-later response and do not disclose whether an email address has an account. The limits protect basic automated account creation and mail abuse but do not claim to defeat disposable mail providers or determined attackers.

### Transactional security messages

Use `StakeControl Seguridad <no-reply@notify.getstakecontrol.com>` as the display sender name while retaining the already verified address and existing `replyTo: support@getstakecontrol.com` behavior.

Send these messages:

- Verification: subject `Confirma tu correo de StakeControl`, a 24-hour single-use verification link, and support Reply-To.
- Password reset: retain the one-hour single-use recovery link and update the security display name.
- Password changed: subject `Tu contraseña de StakeControl fue modificada`; send after both in-session changes and successful reset-token changes; include no password or token and instruct the recipient to contact `support@getstakecontrol.com` if the change was not theirs.

The existing welcome email remains, but is sent only after successful email verification so an unverified address does not receive nonessential mail.

## Data and Route Changes

- Add a Prisma migration for the user verification timestamp and token model.
- The migration backfills `emailVerifiedAt` for every existing user with the migration timestamp, because those accounts were created before verification existed and must not be locked out retroactively.
- Add server-only verification token helpers, parallel to password reset token helpers.
- Add public routes for verifying a token and requesting a resend, plus a confirmation-needed page/state.
- Extend email delivery kinds and delivery ledger keys for verification and password-change messages to provide deduplication and status tracking.

## Testing

- Verify token entropy/format handling indirectly through creation, hashing, expiry, single-use consumption, and superseding-token behavior.
- Verify registration creates an unverified user without an application session.
- Verify login and authenticated capabilities are unavailable until confirmation.
- Verify rate limits for registration, resend, and password reset do not disclose account existence.
- Verify email templates/subjects, security display sender, Reply-To, and password-change dispatch for both password change paths.
- Run migrations against a disposable database, full tests, lint, typecheck, production build, and a production deployment check.

## Boundaries

- No CAPTCHA, billing changes, disposable-email denylist, or third-party identity provider in this iteration.
- No sender address change to `security@notify.getstakecontrol.com`; the proven `no-reply` address remains in use with a security display name.
- Existing users are backfilled as verified by the migration, so this release applies the verification gate only to newly registered accounts.
