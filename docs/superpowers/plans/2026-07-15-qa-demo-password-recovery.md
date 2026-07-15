# QA, datos demo y recuperación de contraseña Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restringir datos demo a dos cuentas QA y dejar preparada una recuperación de contraseña segura para activar email transaccional más adelante.

**Architecture:** Una utilidad de configuración separada autorizará datos demo por correo desde `DEMO_DATA_EMAILS`, tanto en interfaz como en servidor. La recuperación usará tokens aleatorios almacenados como hashes en Prisma y un servicio de email con modo no configurado; las rutas y tokens funcionarán sin proveedor, pero no expondrán enlaces ni enviarán correos hasta configurar Resend.

**Tech Stack:** Next.js 16 Server Actions, React 19, TypeScript, Prisma 7/libSQL, Node `crypto`, Zod, Node.js test runner con `tsx`.

## Global Constraints

- Solo `arielalfaro.94@gmail.com` y `qa@getstakecontrol.com` pueden generar datos demo en producción.
- Usar `DEMO_DATA_EMAILS`, no `PLAN_TESTER_EMAILS`, para autorizar demo.
- La autorización debe aplicarse en el render y en `createDemoDataAction`.
- Los tokens de recuperación son aleatorios, de un solo uso, expiran en 60 minutos y solo se persiste su hash SHA-256.
- No revelar si un correo está registrado al solicitar recuperación.
- Sin `EMAIL_PROVIDER=resend` y `RESEND_API_KEY`, no crear tokens ni revelar enlaces; mostrar que la recuperación por email aún no está disponible y apuntar a `contact@getstakecontrol.com`.
- No configurar Resend, DNS ni envíos de correo en esta entrega.
- En producción, `AUTH_SECRET` debe existir; no usar la clave local por defecto.

---

### Task 1: Autorización exclusiva de datos demo

**Files:**
- Create: `src/lib/demo-access.ts`
- Create: `tests/demo-access.test.mts`
- Modify: `src/lib/demo-actions.ts`
- Modify: `src/app/health/page.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `.env.example`

**Interfaces:**
- Produces: `canUseDemoData(email: string, allowedEmails?: string): boolean`.
- Consumes: `process.env.DEMO_DATA_EMAILS` y el usuario autenticado de `requireUser()`.

- [ ] **Step 1: Escribir las pruebas que fallan**

Crear `tests/demo-access.test.mts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { canUseDemoData, parseDemoDataEmails } from "../src/lib/demo-access";

test("parses the approved demo accounts", () => {
  assert.deepEqual(
    [...parseDemoDataEmails(" arielalfaro.94@gmail.com, qa@getstakecontrol.com ")],
    ["arielalfaro.94@gmail.com", "qa@getstakecontrol.com"]
  );
});

test("only approves configured demo accounts", () => {
  const allowed = "arielalfaro.94@gmail.com,qa@getstakecontrol.com";

  assert.equal(canUseDemoData("ARIELALFARO.94@gmail.com", allowed), true);
  assert.equal(canUseDemoData("qa@getstakecontrol.com", allowed), true);
  assert.equal(canUseDemoData("member@example.com", allowed), false);
});
```

- [ ] **Step 2: Ejecutar la prueba para comprobar que falla**

Run: `npm test -- tests/demo-access.test.mts`

Expected: FAIL porque `src/lib/demo-access.ts` no existe.

- [ ] **Step 3: Implementar la utilidad y proteger la acción**

Crear `src/lib/demo-access.ts`:

```ts
export function parseDemoDataEmails(value = "") {
  return new Set(
    value
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function canUseDemoData(email: string, allowedEmails = process.env.DEMO_DATA_EMAILS) {
  return parseDemoDataEmails(allowedEmails).has(email.trim().toLowerCase());
}
```

En `createDemoDataAction`, importar `canUseDemoData` y, inmediatamente después de obtener `user`, añadir:

```ts
if (!canUseDemoData(user.email)) {
  throw new Error("La carga de datos demo solo está disponible para cuentas QA autorizadas.");
}
```

En `/health` y `/dashboard`, calcular `const canLoadDemoData = canUseDemoData(user.email);` y renderizar cada formulario `createDemoDataAction` solo si `canLoadDemoData` es verdadero. Mantener los avisos de datos demo existentes cuando una cuenta autorizada ya tenga datos.

Añadir a `.env.example`:

```env
# Private QA accounts allowed to generate demo records.
DEMO_DATA_EMAILS=""
```

- [ ] **Step 4: Verificar la prueba**

Run: `npm test -- tests/demo-access.test.mts`

Expected: PASS con dos pruebas aprobadas.

### Task 2: Tokens y servicio de recuperación de contraseña

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/YYYYMMDDHHMMSS_add_password_reset_tokens/migration.sql`
- Create: `src/lib/password-recovery.ts`
- Create: `src/lib/password-recovery-email.ts`
- Create: `tests/password-recovery.test.mts`
- Modify: `src/lib/auth.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `createPasswordResetToken(userId: string)`, `consumePasswordResetToken(token: string)`, `isPasswordRecoveryEmailConfigured()`.
- Consumes: `User`, Prisma, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `EMAIL_PROVIDER`, `RESEND_API_KEY`.

- [ ] **Step 1: Escribir las pruebas que fallan**

Crear pruebas unitarias para helpers puros exportados desde `src/lib/password-recovery.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { hashPasswordResetToken, isPasswordResetTokenUsable } from "../src/lib/password-recovery";

test("hashes reset tokens without retaining their plaintext value", () => {
  assert.equal(hashPasswordResetToken("secret-token"), hashPasswordResetToken("secret-token"));
  assert.notEqual(hashPasswordResetToken("secret-token"), "secret-token");
});

test("accepts only unused, unexpired reset tokens", () => {
  const now = new Date("2026-07-15T12:00:00.000Z");

  assert.equal(isPasswordResetTokenUsable({ expiresAt: new Date("2026-07-15T12:30:00.000Z"), usedAt: null }, now), true);
  assert.equal(isPasswordResetTokenUsable({ expiresAt: new Date("2026-07-15T11:30:00.000Z"), usedAt: null }, now), false);
  assert.equal(isPasswordResetTokenUsable({ expiresAt: new Date("2026-07-15T12:30:00.000Z"), usedAt: now }, now), false);
});
```

- [ ] **Step 2: Ejecutar la prueba para comprobar que falla**

Run: `npm test -- tests/password-recovery.test.mts`

Expected: FAIL porque el módulo no existe.

- [ ] **Step 3: Añadir persistencia y helpers**

Añadir a `User` la relación `passwordResetTokens PasswordResetToken[]` y crear este modelo:

```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  userId    String
  tokenHash String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, expiresAt])
}
```

Crear la migración SQL equivalente. En `src/lib/password-recovery.ts`, generar tokens con `randomBytes(32).toString("base64url")`; hashearlos con `createHash("sha256")`; fijar vencimiento a 60 minutos; invalidar tokens anteriores sin usar antes de crear uno; y marcar `usedAt` en una transacción al consumir uno. Exportar los dos helpers de prueba.

En `src/lib/password-recovery-email.ts`, definir:

```ts
export function isPasswordRecoveryEmailConfigured(environment = process.env) {
  return environment.EMAIL_PROVIDER === "resend" && Boolean(environment.RESEND_API_KEY);
}
```

Agregar `EMAIL_PROVIDER`, `RESEND_API_KEY` y `EMAIL_FROM` vacíos a `.env.example`. No importar ni instalar Resend todavía.

En `src/lib/auth.ts`, reemplazar el fallback de `getAuthSecret()` por una excepción en producción cuando `AUTH_SECRET` no existe; conservar `stakecontrol-local-dev-secret-change-me` solo fuera de producción.

- [ ] **Step 4: Ejecutar la prueba**

Run: `npm test -- tests/password-recovery.test.mts`

Expected: PASS.

### Task 3: Pantallas y acciones públicas de recuperación

**Files:**
- Create: `src/lib/password-recovery-actions.ts`
- Create: `src/components/auth/ForgotPasswordForm.tsx`
- Create: `src/components/auth/ResetPasswordForm.tsx`
- Create: `src/app/forgot-password/page.tsx`
- Create: `src/app/reset-password/page.tsx`
- Modify: `src/components/auth/LoginForm.tsx`
- Test: `tests/password-recovery.test.mts`

**Interfaces:**
- Produces: rutas públicas `/forgot-password` y `/reset-password?token=<token>`.
- Consumes: utilidades de Task 2 y el patrón `useActionState` de `LoginForm`/`ChangePasswordForm`.

- [ ] **Step 1: Añadir prueba de estado sin proveedor**

Extender `tests/password-recovery.test.mts`:

```ts
import { isPasswordRecoveryEmailConfigured } from "../src/lib/password-recovery-email";

test("does not enable recovery delivery without a configured email provider", () => {
  assert.equal(isPasswordRecoveryEmailConfigured({ EMAIL_PROVIDER: "resend", RESEND_API_KEY: "" }), false);
  assert.equal(isPasswordRecoveryEmailConfigured({ EMAIL_PROVIDER: "mock", RESEND_API_KEY: "key" }), false);
});
```

- [ ] **Step 2: Implementar acciones no enumeradoras**

`requestPasswordResetAction` validará un email y, si el proveedor no está configurado, devolverá el mensaje: `La recuperación por email aún no está disponible. Escríbenos a contact@getstakecontrol.com.` sin crear token. Si el proveedor está configurado, buscará el usuario, creará un token solo si existe y pasará el enlace a un adaptador de entrega que por ahora lanza un error claro hasta que se instale el proveedor. La respuesta pública será siempre: `Si existe una cuenta para ese correo, recibirás instrucciones para restablecer tu contraseña.`

`resetPasswordAction` validará token, nueva contraseña de ocho caracteres y confirmación; consumirá el token de forma atómica, actualizará `passwordHash` con `hashPassword`, y redirigirá a `/login?reset=success`.

- [ ] **Step 3: Crear formularios y rutas**

Crear formularios con `useActionState`, mensajes de error/éxito y enlaces de retorno a `/login`. La página de restablecimiento leerá `token` desde `searchParams` y no renderizará un formulario funcional si el token está ausente. Añadir al formulario de login:

```tsx
<Link href="/forgot-password" className="font-semibold text-primary hover:text-primary-hover">
  ¿Olvidaste tu contraseña?
</Link>
```

- [ ] **Step 4: Verificar calidad y despliegue**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run prisma:migrate`

Expected: todas las comprobaciones terminan con código `0`; la migración crea `PasswordResetToken`.

### Task 4: Configuración de producción y provisión de QA

**Files:**
- Create: `scripts/provision-qa-account.mts`
- Modify: `README.md`

**Interfaces:**
- Consumes: `DATABASE_URL`, `TURSO_AUTH_TOKEN`, `QA_ACCOUNT_PASSWORD` y `DEMO_DATA_EMAILS`.
- Produces: cuenta `qa@getstakecontrol.com` con plan Free, límites vacíos, aceptación de términos y onboarding completo.

- [ ] **Step 1: Crear script de provisión idempotente**

El script debe usar Prisma y `hashPassword` para crear o actualizar `qa@getstakecontrol.com`. Debe exigir `QA_ACCOUNT_PASSWORD`, crear `Subscription` Free y `UserLimits` si faltan, y no imprimir la contraseña. Usar país `CL`, moneda `CLP`, zona `America/Santiago`, y marcar confirmaciones necesarias.

- [ ] **Step 2: Configurar Vercel Production**

Añadir en Vercel Production:

```env
DEMO_DATA_EMAILS="arielalfaro.94@gmail.com,qa@getstakecontrol.com"
AUTH_SECRET="<secreto aleatorio de al menos 32 bytes>"
```

No añadir `EMAIL_PROVIDER`, `RESEND_API_KEY` ni `EMAIL_FROM` hasta configurar el dominio y Resend.

- [ ] **Step 3: Generar y usar contraseña QA**

Run: `openssl rand -base64 24`

Guardar el resultado temporalmente como `QA_ACCOUNT_PASSWORD` solo para ejecutar el script contra la base remota. Comunicarlo una vez al propietario y no registrarlo en archivos ni en Git.

- [ ] **Step 4: Publicar y comprobar**

Run: `git diff --check && git add prisma src tests scripts README.md .env.example && git commit -m "Add QA demo access and password recovery" && git push origin main`

Expected: Vercel crea un deployment de producción; solo las dos cuentas autorizadas ven y pueden ejecutar la carga demo.
