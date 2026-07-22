# Branded Email Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render branded, accessible StakeControl templates for reset, welcome, and alert emails.

**Architecture:** Extract a pure layout renderer from the email delivery service. Each existing send method supplies title, copy, CTA and text fallback; delivery, deduplication and Resend behavior remain unchanged.

**Tech Stack:** TypeScript, Next.js server code, Node test runner with tsx.

## Global Constraints

- Use inline email-safe CSS and a clear brand treatment; keep a plain-text alternative.
- Escape dynamic HTML values and do not add sensitive betting data.
- Do not modify delivery persistence or user preference behavior.

---

### Task 1: Branded layout renderer

**Files:**
- Create: `src/lib/email/email-templates.ts`
- Modify: `src/lib/email/email-delivery.ts`
- Modify: `tests/email-delivery.test.mts`

- [ ] **Step 1: Write a failing template assertion**

```ts
assert.match(welcome.html, /StakeControl/);
assert.match(welcome.html, /background:#0B252B/);
assert.match(welcome.html, /Restablecer contraseña/);
```

- [ ] **Step 2: Run test**

Run: `node --import tsx --test tests/email-delivery.test.mts`

Expected: FAIL because the current inline email has no shared brand layout.

- [ ] **Step 3: Implement pure layout and connect all three variants**

Create `renderEmailTemplate({ preheader, eyebrow, title, bodyHtml, bodyText, ctaLabel, ctaUrl, footerNote })`, with a 600px container, dark header, grid detail, brand wordmark, light body and accessible CTA. Have welcome, password-reset and responsible-alert sends call it.

- [ ] **Step 4: Verify**

Run: `node --import tsx --test tests/email-delivery.test.mts && npm run typecheck && npm run build`

Expected: all checks pass.

- [ ] **Step 5: Commit and deploy**

```bash
git add src/lib/email/email-templates.ts src/lib/email/email-delivery.ts tests/email-delivery.test.mts
git commit -m "Style StakeControl transactional emails"
git push origin main
vercel --prod --yes
```
