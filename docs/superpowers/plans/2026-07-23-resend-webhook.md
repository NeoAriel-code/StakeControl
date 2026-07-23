# Resend Webhook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Registrar eventos autenticados de Resend, suprimir correos no esenciales para direcciones rebotadas o denunciadas, y mostrar alertas internas para fallos de correo de seguridad.

**Architecture:** La ruta de Next.js validará el cuerpo crudo y la firma Svix antes de pasar el evento verificado a un servicio puro e inyectable. Ese servicio aplica idempotencia por identificador de evento, actualiza el ledger por `providerMessageId`, registra hashes de destinatario restringidos y crea alertas de seguridad asociadas a la entrega.

**Tech Stack:** Next.js route handlers, Resend SDK 6, Prisma 7 / Turso SQLite, Node test runner y TypeScript.

## Global Constraints

- Validar siempre la firma de Resend antes de parsear o persistir el webhook.
- No guardar destinatarios ni cuerpos de mensajes en texto plano; usar SHA-256 normalizado.
- Soportar exactamente `email.delivered`, `email.bounced`, `email.complained`, `email.failed` y `email.delivery_delayed`.
- Rebotes y quejas suprimen mensajes no esenciales; verificación, recuperación y cambio de contraseña nunca se suprimen.
- Todo evento debe ser idempotente por `svix-id`.
- `RESEND_WEBHOOK_SECRET` se mantiene solo en variables de servidor y Vercel Production.

---

### Task 1: Persistencia de eventos, restricciones y alertas de seguridad

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260723110000_add_resend_webhooks/migration.sql`
- Modify: `src/lib/schema-migrations.ts`
- Modify: `tests/schema-migrations.test.mts`
- Create: `tests/email-webhook-persistence.test.mts`

**Interfaces:**
- Produces `EmailWebhookEvent`, `RestrictedEmailAddress` y `AccountSecurityAlert` para el procesador de webhook.
- Extiende `EmailDelivery` con `recipientHash`, marcas de evento y un `providerMessageId` único cuando no es nulo.

- [ ] **Step 1: Write the failing schema test**

```ts
test("email delivery persistence supports webhook events without plaintext recipients", async () => {
  const schema = await readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
  assert.match(schema, /model EmailWebhookEvent/);
  assert.match(schema, /model RestrictedEmailAddress/);
  assert.match(schema, /model AccountSecurityAlert/);
  assert.match(schema, /recipientHash\s+String\?/);
  assert.match(schema, /providerMessageId\s+String\?\s+@unique/);
});
```

- [ ] **Step 2: Run the failing test**

Run: `node --import tsx --test tests/email-webhook-persistence.test.mts`  
Expected: FAIL because the models and fields do not exist.

- [ ] **Step 3: Add the Prisma schema and registered SQLite migration**

```prisma
model EmailWebhookEvent {
  id              String   @id @default(cuid())
  providerEventId String   @unique
  eventType       String
  providerMessageId String?
  createdAt       DateTime @default(now())
}

model RestrictedEmailAddress {
  id        String   @id @default(cuid())
  emailHash String   @unique
  reason    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model AccountSecurityAlert {
  id         String   @id @default(cuid())
  userId     String
  deliveryId String   @unique
  kind       String
  occurredAt DateTime
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  delivery   EmailDelivery @relation(fields: [deliveryId], references: [id], onDelete: Cascade)
}
```

Add corresponding foreign key/index SQL in `20260723110000_add_resend_webhooks/migration.sql`, then register it in `MANAGED_SCHEMA_MIGRATIONS` with required tables `EmailWebhookEvent`, `RestrictedEmailAddress` and `AccountSecurityAlert`.

- [ ] **Step 4: Run the persistence test and Prisma validation**

Run: `node --import tsx --test tests/email-webhook-persistence.test.mts && npx prisma validate && npx prisma generate`  
Expected: PASS and a valid Prisma schema.

- [ ] **Step 5: Commit**

```bash
git add prisma src/lib/schema-migrations.ts tests/schema-migrations.test.mts tests/email-webhook-persistence.test.mts
git commit -m "Add email webhook persistence"
```

### Task 2: Delivery policy and webhook event processor

**Files:**
- Create: `src/lib/email/email-webhook.ts`
- Modify: `src/lib/email/email-delivery.ts`
- Modify: `src/lib/email/email-service.ts`
- Create: `tests/email-webhook.test.mts`
- Modify: `tests/email-delivery.test.mts`

**Interfaces:**
- Produces `hashEmailAddress(email: string): string`, `isSecurityEmailKind(kind): boolean`, and `processEmailWebhookEvent(event, repository): Promise<void>`.
- The processor consumes verified `{ id, type, created_at, data: { email_id, to } }` Resend events.
- The email service consumes `repository.isRestricted(emailHash)` before non-security sends.

- [ ] **Step 1: Write failing processor and policy tests**

```ts
test("a bounced delivery restricts only the recipient hash and creates one security alert", async () => {
  const result = await processEmailWebhookEvent(bouncedSecurityEvent, repository);
  assert.equal(result, "processed");
  assert.equal(restrictions[0]?.emailHash, hashEmailAddress("person@example.com"));
  assert.equal(alerts.length, 1);
});

test("a duplicate Svix event is ignored", async () => {
  assert.equal(await processEmailWebhookEvent(deliveredEvent, duplicateRepository), "duplicate");
});

test("restricted recipients suppress non-security deliveries but not password resets", async () => {
  assert.equal(await service.sendWelcome(welcomeInput), false);
  assert.equal(await service.sendPasswordReset(resetInput), true);
});
```

- [ ] **Step 2: Run the failing tests**

Run: `node --import tsx --test tests/email-webhook.test.mts tests/email-delivery.test.mts`  
Expected: FAIL because the processor and policy do not exist.

- [ ] **Step 3: Implement the processor and delivery suppression**

```ts
const securityKinds = new Set(["EMAIL_VERIFICATION", "PASSWORD_RESET", "PASSWORD_CHANGED"]);

export function isSecurityEmailKind(kind: EmailDeliveryKind) {
  return securityKinds.has(kind);
}

export function hashEmailAddress(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}
```

The processor first creates `EmailWebhookEvent` by `providerEventId`; on unique conflict it returns `"duplicate"`. It finds `EmailDelivery` by `providerMessageId`, updates the event timestamps, upserts `RestrictedEmailAddress` only for bounced/complained events, and creates `AccountSecurityAlert` only for non-delivered events on security delivery kinds. The sender repository hashes `input.to`, stores it in `EmailDelivery`, and checks restrictions before pending delivery for non-security kinds.

- [ ] **Step 4: Run focused tests**

Run: `node --import tsx --test tests/email-webhook.test.mts tests/email-delivery.test.mts`  
Expected: PASS with all webhook and suppression cases green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/email tests/email-webhook.test.mts tests/email-delivery.test.mts
git commit -m "Process Resend delivery webhooks"
```

### Task 3: Authenticated Next.js endpoint and in-app security notice

**Files:**
- Create: `src/app/api/webhooks/resend/route.ts`
- Create: `src/components/account/EmailSecurityAlert.tsx`
- Modify: `src/app/dashboard/layout.tsx`
- Modify: `.env.example`
- Create: `tests/resend-webhook-route.test.mts`
- Create: `tests/account-security-alert.test.mts`

**Interfaces:**
- Route reads raw `Request.text()` and calls `resend.webhooks.verify({ payload, headers, webhookSecret })`.
- `EmailSecurityAlert` accepts `{ alerts: Array<{ id: string; kind: string; occurredAt: Date }> }`.

- [ ] **Step 1: Write failing route and UI source tests**

```ts
test("Resend webhook route verifies the raw payload before processing", async () => {
  const route = await readFile(new URL("../src/app/api/webhooks/resend/route.ts", import.meta.url), "utf8");
  assert.match(route, /await request\.text\(\)/);
  assert.match(route, /resend\.webhooks\.verify/);
  assert.match(route, /RESEND_WEBHOOK_SECRET/);
});

test("dashboard layout renders account security email alerts", async () => {
  const layout = await readFile(new URL("../src/app/dashboard/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /EmailSecurityAlert/);
});
```

- [ ] **Step 2: Run the failing tests**

Run: `node --import tsx --test tests/resend-webhook-route.test.mts tests/account-security-alert.test.mts`  
Expected: FAIL because the endpoint and component do not exist.

- [ ] **Step 3: Implement route, configuration, and dashboard alert**

```ts
export async function POST(request: Request) {
  const payload = await request.text();
  const event = resend.webhooks.verify({ payload, headers: svixHeaders(request), webhookSecret: process.env.RESEND_WEBHOOK_SECRET! });
  await processEmailWebhookEvent(event, repository);
  return Response.json({ received: true });
}
```

Return `400` for missing Svix headers, `401` for invalid signature, and `200` only after a verified event has been processed. Add `RESEND_WEBHOOK_SECRET=""` to `.env.example`. Query non-dismissed `AccountSecurityAlert` records for the current user in the dashboard layout and render a concise support/update-contact notice.

- [ ] **Step 4: Run endpoint/UI tests and build checks**

Run: `node --import tsx --test tests/resend-webhook-route.test.mts tests/account-security-alert.test.mts && npm run lint && npx tsc --noEmit`  
Expected: PASS with no lint or type errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/webhooks/resend src/components/account src/app/dashboard/layout.tsx .env.example tests/resend-webhook-route.test.mts tests/account-security-alert.test.mts
git commit -m "Add authenticated Resend webhook endpoint"
```

### Task 4: Production verification and Resend setup handoff

**Files:**
- Modify: no repository files unless deployment verification finds an issue.

**Interfaces:**
- Requires `RESEND_WEBHOOK_SECRET` configured as encrypted Production variable.
- Endpoint URL: `https://app.getstakecontrol.com/api/webhooks/resend`.

- [ ] **Step 1: Set the Vercel variable without exposing its value**

Run: `vercel env add RESEND_WEBHOOK_SECRET production`  
Expected: Vercel stores an encrypted value; paste the webhook signing secret when prompted.

- [ ] **Step 2: Run all repository verification**

Run: `npm test && npm run lint && npx tsc --noEmit && npm run build`  
Expected: all tests pass, lint/typecheck are clean, and the build completes.

- [ ] **Step 3: Push and deploy production**

```bash
git push origin main
vercel deploy --prod -y
```

Expected: a Ready production deployment.

- [ ] **Step 4: Configure Resend dashboard**

Create a Resend webhook pointing to `https://app.getstakecontrol.com/api/webhooks/resend`, paste the same signing secret in Vercel, and select `email.delivered`, `email.bounced`, `email.complained`, `email.failed`, and `email.delivery_delayed`.

- [ ] **Step 5: Verify webhook delivery from Resend**

Send Resend’s webhook test event, then confirm the endpoint returns 200 and the corresponding delivery/event row is recorded without recipient plaintext.
