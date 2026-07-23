# Official Contact Channels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route replies to transactional emails into support and provide usable official contact links in the public site.

**Architecture:** Extend the server-only Resend configuration with an optional `EMAIL_REPLY_TO`, then forward it to the SDK as `replyTo`. Keep the verified `EMAIL_FROM` sender unchanged. Add semantic `mailto:` anchors to the existing legal copy and public home footer, covered by source-based tests.

**Tech Stack:** Next.js 16, TypeScript, Resend Node SDK, Node test runner with tsx, Tailwind CSS.

## Global Constraints

- Keep `EMAIL_FROM` unchanged; production sender remains `StakeControl <no-reply@notify.getstakecontrol.com>`.
- `EMAIL_REPLY_TO` is optional and must not enable email delivery by itself.
- Do not expose Resend credentials or mailbox credentials to client code.
- Official addresses are `contact@getstakecontrol.com`, `privacy@getstakecontrol.com`, and `support@getstakecontrol.com`.
- Do not change Zoho or Resend domain configuration from the application.

---

### Task 1: Configure transactional Reply-To delivery

**Files:**
- Modify: `src/lib/email/email-config.ts`
- Modify: `src/lib/email/email-service.ts`
- Modify: `.env.example`
- Modify: `tests/email-config.test.mts`
- Create: `tests/email-reply-to.test.mts`

**Interfaces:**
- Consumes: `EMAIL_PROVIDER`, `RESEND_API_KEY`, `EMAIL_FROM`, optional `EMAIL_REPLY_TO` from `process.env`.
- Produces: `EmailConfiguration` with optional `replyTo?: string`; Resend calls include `replyTo` only when it is configured.

- [ ] **Step 1: Write failing configuration and adapter tests**

```ts
test("email config includes a nonblank Reply-To without making it required", () => {
  assert.deepEqual(
    getEmailConfiguration({
      EMAIL_PROVIDER: "resend",
      RESEND_API_KEY: "re_test",
      EMAIL_FROM: "StakeControl <no-reply@notify.getstakecontrol.com>",
      EMAIL_REPLY_TO: " support@getstakecontrol.com ",
    }),
    {
      provider: "resend",
      apiKey: "re_test",
      from: "StakeControl <no-reply@notify.getstakecontrol.com>",
      replyTo: "support@getstakecontrol.com",
    },
  );
});
```

Create `tests/email-reply-to.test.mts`:

```ts
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const emailServicePath = new URL("../src/lib/email/email-service.ts", import.meta.url);

test("Resend delivery forwards the configured Reply-To address", async () => {
  const source = await readFile(emailServicePath, "utf8");

  assert.match(source, /\.\.\.\(config\.replyTo \? \{ replyTo: config\.replyTo \} : \{\}\)/);
});
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `node --import tsx --test tests/email-config.test.mts tests/email-reply-to.test.mts`

Expected: FAIL because `replyTo` is not present in the configuration or Resend request.

- [ ] **Step 3: Add the optional configuration and send property**

```ts
export type EmailConfiguration = {
  provider: "resend";
  apiKey: string;
  from: string;
  replyTo?: string;
};

const replyTo = environment.EMAIL_REPLY_TO?.trim();
return { provider: "resend", apiKey, from, ...(replyTo ? { replyTo } : {}) };
```

In `email-service.ts`, call the Resend SDK with:

```ts
await resend.emails.send({
  from: config.from,
  to: [input.to],
  subject: input.subject,
  html: input.html,
  text: input.text,
  ...(config.replyTo ? { replyTo: config.replyTo } : {}),
});
```

Add `EMAIL_REPLY_TO=""` directly after `EMAIL_FROM` in `.env.example`.

- [ ] **Step 4: Run focused tests to verify they pass**

Run: `node --import tsx --test tests/email-config.test.mts tests/email-reply-to.test.mts`

Expected: PASS with every subtest green.

- [ ] **Step 5: Commit the email configuration change**

```bash
git add src/lib/email/email-config.ts src/lib/email/email-service.ts .env.example tests/email-config.test.mts tests/email-reply-to.test.mts
git commit -m "Route transactional email replies to support"
```

### Task 2: Publish usable contact links

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/terms/page.tsx`
- Modify: `src/app/privacy/page.tsx`
- Create: `tests/public-contact-links.test.mts`

**Interfaces:**
- Consumes: the existing public footer and legal contact copy.
- Produces: accessible `mailto:` anchors for support, general contact, and privacy.

- [ ] **Step 1: Write a failing public contact link test**

```ts
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const homePath = new URL("../src/app/page.tsx", import.meta.url);
const termsPath = new URL("../src/app/terms/page.tsx", import.meta.url);
const privacyPath = new URL("../src/app/privacy/page.tsx", import.meta.url);

test("public pages expose official contact addresses as mail links", async () => {
  const [home, terms, privacy] = await Promise.all([
    readFile(homePath, "utf8"),
    readFile(termsPath, "utf8"),
    readFile(privacyPath, "utf8"),
  ]);

  assert.match(home, /href="mailto:support@getstakecontrol\\.com"/);
  assert.match(home, /href="mailto:contact@getstakecontrol\\.com"/);
  assert.match(home, /href="mailto:privacy@getstakecontrol\\.com"/);
  assert.match(terms, /href="mailto:contact@getstakecontrol\\.com"/);
  assert.match(terms, /href="mailto:privacy@getstakecontrol\\.com"/);
  assert.match(privacy, /href="mailto:privacy@getstakecontrol\\.com"/);
});
```

- [ ] **Step 2: Run the contact test to verify it fails**

Run: `node --import tsx --test tests/public-contact-links.test.mts`

Expected: FAIL because the addresses are plain text or absent from the public footer.

- [ ] **Step 3: Add semantic links and responsive footer copy**

Replace the Terms and Privacy plain-text addresses with `<a href="mailto:…">` elements styled with the existing underline/hover pattern. In the public home footer, add a wrapped group named `Contacto` containing the three address links and short labels: `Soporte`, `General`, and `Privacidad`.

- [ ] **Step 4: Run the contact test to verify it passes**

Run: `node --import tsx --test tests/public-contact-links.test.mts`

Expected: PASS.

- [ ] **Step 5: Commit the public contact links**

```bash
git add src/app/page.tsx src/app/terms/page.tsx src/app/privacy/page.tsx tests/public-contact-links.test.mts
git commit -m "Publish official contact links"
```

### Task 3: Verify the integrated change

**Files:**
- Verify only: all files changed in Tasks 1 and 2.

- [ ] **Step 1: Run quality checks**

Run:

```bash
npm test
npm run lint
npm run typecheck
env DATABASE_URL=file:/tmp/stakecontrol-contact-build.db npm run build
```

Expected: all commands exit with status 0.

- [ ] **Step 2: Inspect the final diff**

Run:

```bash
git diff HEAD~2..HEAD --check
git status --short
```

Expected: no whitespace errors and no unexpected changes.

- [ ] **Step 3: Push and verify production after explicit approval**

Run:

```bash
git push origin main
vercel list --environment production --format json
```

Expected: the latest production deployment is `READY` and its Git metadata points to the final `main` commit.
