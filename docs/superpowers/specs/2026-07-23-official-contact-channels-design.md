# Official Contact Channels Design

## Goal

Make StakeControl's official contact addresses easy to use in the public site and direct replies to transactional messages to the support mailbox, while keeping the existing verified Resend sender unchanged.

## Current State

- Resend sends transactional messages using the configured `EMAIL_FROM` value, currently `StakeControl <no-reply@notify.getstakecontrol.com>`.
- Zoho hosts the real mailboxes: `contact@getstakecontrol.com`, `privacy@getstakecontrol.com`, and `support@getstakecontrol.com`.
- Terms and Privacy already mention the general and privacy addresses as plain text. The public home footer links only to Terms, Privacy, and sign-in.

## Design

### Transactional email replies

Add optional `EMAIL_REPLY_TO` configuration. Email delivery is enabled only when `EMAIL_PROVIDER`, `RESEND_API_KEY`, and `EMAIL_FROM` are configured, preserving the current fail-closed behavior. When `EMAIL_REPLY_TO` has a nonblank value, the Resend adapter sends it as `replyTo`; when it is absent, it omits the property.

Production configuration will set:

```env
EMAIL_REPLY_TO="support@getstakecontrol.com"
```

This retains `no-reply@notify.getstakecontrol.com` as the visible sender and sends user replies to the Zoho support mailbox. No API key, address, or mailbox credential is exposed to the browser.

### Public contact links

Use explicit `mailto:` links rather than plain text:

- Terms: `contact@getstakecontrol.com` for general contact and `privacy@getstakecontrol.com` for privacy.
- Privacy: `privacy@getstakecontrol.com` for privacy requests and rights requests.
- Public home footer: add a compact contact group with `support@getstakecontrol.com` (support), `contact@getstakecontrol.com` (general), and `privacy@getstakecontrol.com` (privacy).

Each link keeps the existing visual system and opens the user's configured mail client. The footer remains responsive by wrapping its link group on narrow screens.

## Boundaries

- Do not change the sender address, Resend API key, or Zoho mailbox configuration.
- Do not send inbound email through the application or persist support requests.
- Do not add contact addresses to authenticated application navigation in this scope.

## Testing

- Extend email configuration tests to cover optional reply-to parsing.
- Add adapter coverage that verifies Resend receives `replyTo` only when configured.
- Add source-based regression coverage for the three public `mailto:` links.
- Run the focused tests, full test suite, lint, typecheck, and production build before deployment.
