# Política de privacidad de StakeControl Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar una política de privacidad completa y coherente con los datos, proveedores configurables y retención de StakeControl.

**Architecture:** Se actualizará solamente la ruta `/privacy`, manteniendo su composición de tarjetas y enlaces. Una prueba de contenido basada en el archivo fuente evitará que futuras ediciones eliminen declaraciones acordadas, sin añadir una dependencia de pruebas de interfaz.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Node.js test runner con `tsx`.

## Global Constraints

- Responsable: StakeControl; canal: `privacy@getstakecontrol.com`.
- No se venden datos personales. Se nombran Vercel, Turso/libSQL, Supabase Storage, Google Cloud Vision y OpenAI; Supabase, Vision y OpenAI se presentan como configurables.
- Informar transferencias fuera de Chile, retención durante cuenta activa, eliminación operativa al borrar la cuenta y respaldos por hasta 30 días.
- La IA es de apoyo y no toma decisiones automáticas con efectos legales o equivalentes.
- Servicio para mayores de edad; cookies/almacenamiento local esenciales; analítica futura exige actualización de la política.
- No modificar flujos de cuenta, almacenamiento, OCR, IA ni eliminación de cuenta.

---

### Task 1: Prueba de cobertura de privacidad

**Files:**
- Create: `tests/privacy-page.test.mts`

**Interfaces:**
- Consumes: `src/app/privacy/page.tsx` mediante `readFile`.
- Produces: una prueba de regresión ejecutable con `npm test -- tests/privacy-page.test.mts`.

- [ ] **Step 1: Escribir la prueba que falla**

Crear `tests/privacy-page.test.mts`:

```ts
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const privacyPagePath = new URL("../src/app/privacy/page.tsx", import.meta.url);

test("privacy page states the agreed data practices and contact channel", async () => {
  const source = await readFile(privacyPagePath, "utf8");

  for (const expectedCopy of [
    "privacy@getstakecontrol.com",
    "StakeControl no vende datos personales.",
    "Vercel",
    "Turso/libSQL",
    "Supabase Storage",
    "Google Cloud Vision",
    "OpenAI",
    "hasta 30 días",
    "no toma decisiones automáticas",
    "mayores de edad",
  ]) {
    assert.ok(source.includes(expectedCopy), `Expected privacy policy to include: ${expectedCopy}`);
  }
});
```

- [ ] **Step 2: Ejecutar la prueba para comprobar que falla**

Run: `npm test -- tests/privacy-page.test.mts`

Expected: FAIL con un mensaje que indique que falta `privacy@getstakecontrol.com` u otro texto acordado.

- [ ] **Step 3: Confirmar la causa del fallo**

Verificar que el error provenga de `assert.ok` y de la ausencia de texto acordado, no de la ruta ni del runner. No añadir dependencias.

### Task 2: Política completa en la ruta pública

**Files:**
- Modify: `src/app/privacy/page.tsx`
- Test: `tests/privacy-page.test.mts`

**Interfaces:**
- Consumes: restricciones globales y el patrón actual de tarjetas de `src/app/privacy/page.tsx`.
- Produces: `PrivacyPage` con las declaraciones acordadas y enlaces conservados a `/terms` y `/dashboard`.

- [ ] **Step 1: Reemplazar las tarjetas de contenido**

Conservar imports, metadatos, contenedor, tarjeta de encabezado y enlaces. Cambiar el `description` a `"Política de privacidad de StakeControl."`. Añadir secciones con los títulos `Responsable y contacto`, `Datos que tratamos`, `Finalidades del tratamiento`, `Proveedores y transferencias`, `Uso de OCR e inteligencia artificial`, `Retención y eliminación`, `Tus derechos`, `Menores de edad` y `Cookies y almacenamiento local`, usando el patrón `section`/`h2`/`p` actual.

En la sección de responsable, usar:

```tsx
StakeControl es responsable del tratamiento de los datos descritos en esta política. Para consultas o solicitudes de privacidad, escríbenos a privacy@getstakecontrol.com.
```

En proveedores, usar:

```tsx
StakeControl no vende datos personales. Para prestar el servicio podemos utilizar proveedores tecnológicos que procesan información por cuenta de StakeControl: Vercel para hosting y despliegue; Turso/libSQL para la base de datos; Supabase Storage para archivos privados de tickets cuando está configurado; Google Cloud Vision para OCR cuando está configurado; y OpenAI para extracción estructurada y análisis de IA cuando está configurado. Estos proveedores pueden procesar datos fuera de Chile, de acuerdo con sus regiones operativas y los acuerdos aplicables.
```

En IA, usar:

```tsx
Cuando la función está habilitada, podemos enviar al proveedor de IA el texto extraído y los datos necesarios del ticket o historial para la extracción o el análisis solicitado. La IA es una herramienta de apoyo, no toma decisiones automáticas con efectos legales o equivalentes, no determina resultados de apuestas y no reemplaza tu criterio.
```

En retención, usar:

```tsx
Conservamos los datos mientras tu cuenta esté activa. Al eliminarla, eliminamos los datos operativos y los archivos privados asociados. Las copias de seguridad pueden conservarse hasta 30 días, salvo que una obligación legal aplicable exija conservar información por más tiempo.
```

En derechos, menores y cookies, usar respectivamente:

```tsx
Puedes solicitar acceso, rectificación, supresión o portabilidad de tus datos escribiendo a privacy@getstakecontrol.com. Responderemos dentro del plazo legal aplicable.
StakeControl es un servicio exclusivo para mayores de edad.
Usamos cookies y almacenamiento local esenciales para recordar preferencias y mantener el funcionamiento del servicio. Si incorporamos analítica u otras tecnologías no esenciales, actualizaremos esta política y solicitaremos el aviso o consentimiento que corresponda.
```

En datos, incluir correo, nombre opcional, preferencias, confirmaciones, apuestas, límites, alertas, tickets/metadatos, OCR y reportes/análisis. En finalidades, incluir cuenta, tickets, historial, métricas, reportes, alertas de autocontrol, seguridad, soporte y suscripciones. Mantener la aclaración de que no se guardan credenciales ni se conectan cuentas externas de apuestas.

- [ ] **Step 2: Ejecutar la prueba de contenido**

Run: `npm test -- tests/privacy-page.test.mts`

Expected: PASS con una prueba aprobada.

- [ ] **Step 3: Ejecutar las comprobaciones automatizadas**

Run: `npm test && npx tsc --noEmit && npm run lint`

Expected: los tres comandos terminan con código `0`.

- [ ] **Step 4: Revisar visualmente la página**

Run: `npm run dev`

Abrir: `http://localhost:3000/privacy`

Expected: encabezado, nueve secciones y enlaces se ven legibles en escritorio y móvil, sin desbordamiento horizontal.

- [ ] **Step 5: Verificar el diff y registrar el cambio**

Run: `git diff --check && git diff -- src/app/privacy/page.tsx tests/privacy-page.test.mts`

Expected: `git diff --check` no imprime salida; el diff contiene solo la página y la prueba.

```bash
git add src/app/privacy/page.tsx tests/privacy-page.test.mts
git commit -m "Expand privacy policy"
```

