# Términos globales del MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar términos de uso completos para el MVP global de StakeControl sin declarar cobros, intermediación de apuestas ni servicios inexistentes.

**Architecture:** Se sustituirá el contenido de la página estática `/terms` por tarjetas temáticas, manteniendo sus enlaces y el alias `/terminos`. Una prueba de contenido leerá el archivo fuente para impedir regresiones en las declaraciones de alcance, legalidad, IA y contacto.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Node.js test runner con `tsx`.

## Global Constraints

- Prestador: StakeControl, empresa chilena; contacto general `contact@getstakecontrol.com`; privacidad `privacy@getstakecontrol.com`.
- El MVP no cobra, no tiene pasarela de pago, renovación automática, reembolsos, marketing ni emails salientes.
- StakeControl no acepta, ejecuta, procesa, transmite, liquida ni intermedia apuestas; tampoco ofrece afiliados, enlaces a operadores, bonos, promociones ni recomendaciones de apuestas.
- El servicio puede estar disponible globalmente; cada usuario debe cumplir la normativa aplicable en su ubicación.
- Ley chilena, sin limitar derechos imperativos aplicables a consumidores ni reglas obligatorias de competencia.
- OCR e IA son herramientas de apoyo, potencialmente inexactas, y no toman decisiones automáticas.
- Mantener el estilo de tarjetas y los enlaces existentes a `/privacy` y `/dashboard`.

---

### Task 1: Prueba de cobertura de los términos

**Files:**
- Create: `tests/terms-page.test.mts`

**Interfaces:**
- Consumes: el contenido fuente de `src/app/terms/page.tsx` mediante `readFile`.
- Produces: una prueba de regresión ejecutable con `npm test -- tests/terms-page.test.mts`.

- [ ] **Step 1: Escribir la prueba que falla**

Crear `tests/terms-page.test.mts`:

```ts
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const termsPagePath = new URL("../src/app/terms/page.tsx", import.meta.url);

test("terms page states the MVP scope, global use rules and contact channels", async () => {
  const source = await readFile(termsPagePath, "utf8");
  const renderedText = source.replace(/\s+/g, " ");

  for (const expectedCopy of [
    "contact@getstakecontrol.com",
    "privacy@getstakecontrol.com",
    "no acepta, ejecuta, procesa, transmite, liquida ni intermedia apuestas",
    "no ofrece afiliados, enlaces a operadores, bonos, promociones",
    "normativa aplicable en tu ubicación",
    "herramientas de apoyo",
    "no hay pasarela de pago, cargos, renovaciones automáticas ni reembolsos activos",
    "leyes de Chile",
    "mayores de edad",
  ]) {
    assert.ok(renderedText.includes(expectedCopy), `Expected terms to include: ${expectedCopy}`);
  }
});
```

- [ ] **Step 2: Ejecutar la prueba para comprobar que falla**

Run: `npm test -- tests/terms-page.test.mts`

Expected: FAIL indicando que falta `contact@getstakecontrol.com` u otra declaración nueva.

### Task 2: Términos de uso globales del MVP

**Files:**
- Modify: `src/app/terms/page.tsx`
- Test: `tests/terms-page.test.mts`

**Interfaces:**
- Consumes: restricciones globales y las tarjetas de la página existente.
- Produces: `TermsPage` con condiciones completas y los enlaces actuales.

- [ ] **Step 1: Actualizar metadata y encabezado**

Cambiar `metadata.description` por `"Términos de uso de StakeControl para su MVP global."`. Bajo el `h1`, indicar que estos términos aplican al MVP global de StakeControl como herramienta de registro, análisis histórico y autocontrol.

- [ ] **Step 2: Reemplazar las tarjetas por secciones completas**

Conservar `main`, `section` exterior, clases y enlaces finales. Añadir tarjetas tituladas `Quién presta el servicio y contacto`, `Descripción y límites del servicio`, `Uso global y cumplimiento local`, `Cuenta y uso permitido`, `Conductas prohibidas`, `Uso responsable`, `OCR e inteligencia artificial`, `Planes y pagos del MVP`, `Propiedad intelectual`, `Disponibilidad, suspensión y cierre`, `Limitación de responsabilidad`, `Cambios a estos términos` y `Ley aplicable`.

Usar literalmente estos bloques dentro de las secciones correspondientes:

```tsx
StakeControl es una empresa chilena. Para soporte y asuntos generales, escríbenos a contact@getstakecontrol.com. Para asuntos de privacidad, escríbenos a privacy@getstakecontrol.com.
```

```tsx
StakeControl es una herramienta de registro, análisis histórico y autocontrol. No es un operador, casa de apuestas, procesador de pagos, intermediario ni asesor de apuestas: no acepta, ejecuta, procesa, transmite, liquida ni intermedia apuestas. Tampoco ofrece afiliados, enlaces a operadores, bonos, promociones, comparaciones de promociones ni recomendaciones de casas, mercados, selecciones o stakes.
```

```tsx
El servicio puede estar disponible globalmente. Debes verificar y cumplir la normativa aplicable en tu ubicación; la disponibilidad de StakeControl no afirma que las apuestas u otras actividades relacionadas sean legales en una jurisdicción determinada.
```

```tsx
El servicio es para mayores de edad. Debes proporcionar información veraz, proteger tus credenciales y usar StakeControl solo para fines personales y lícitos.
```

```tsx
No puedes usar el servicio de forma ilícita, suplantar a terceros, interferir con su funcionamiento, extraer datos de manera automatizada sin autorización, cargar contenido sin derechos o usar StakeControl para facilitar, promocionar o intermediar apuestas.
```

```tsx
El OCR y la IA son herramientas de apoyo. Pueden producir información incompleta o incorrecta y debes revisarla antes de usarla. No constituyen asesoría financiera, jurídica, médica ni de apuestas, y no toman decisiones automáticas sobre ti ni tus apuestas.
```

```tsx
Los niveles Free y Premium son niveles de acceso del MVP. Actualmente no hay pasarela de pago, cargos, renovaciones automáticas ni reembolsos activos. Antes de habilitar pagos, StakeControl informará las condiciones aplicables y solicitará las aceptaciones necesarias.
```

```tsx
Estos términos se rigen por las leyes de Chile, sin limitar los derechos irrenunciables que te correspondan conforme a normas obligatorias de protección al consumidor ni las reglas de competencia imperativa aplicables.
```

En las secciones restantes, expresar que: los reportes no prometen rendimientos y el usuario es responsable de sus decisiones; StakeControl conserva su propiedad intelectual y concede una licencia limitada, personal, revocable e intransferible; el MVP puede tener errores, cambios o interrupciones; StakeControl puede modificar, suspender o cerrar el servicio o una cuenta por seguridad, operación o incumplimiento procurando aviso razonable cuando sea posible; la responsabilidad se limita en la máxima medida permitida por ley y no excluye responsabilidad no limitable; y los términos pueden cambiar con publicación de la versión actualizada.

- [ ] **Step 3: Ejecutar la prueba de contenido para comprobar que pasa**

Run: `npm test -- tests/terms-page.test.mts`

Expected: PASS con una prueba aprobada.

- [ ] **Step 4: Ejecutar verificaciones automatizadas**

Run: `npm test && npx tsc --noEmit && npm run lint`

Expected: los tres comandos terminan con código `0`.

- [ ] **Step 5: Verificar el diff y registrar el cambio**

Run: `git diff --check && git diff -- src/app/terms/page.tsx tests/terms-page.test.mts`

Expected: `git diff --check` no imprime salida y el diff solo contiene los términos y su prueba.

```bash
git add src/app/terms/page.tsx tests/terms-page.test.mts
git commit -m "Expand MVP terms of use"
```

