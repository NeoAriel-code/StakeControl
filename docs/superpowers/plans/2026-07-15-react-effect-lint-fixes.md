# Corrección de efectos React Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar los errores de lint por actualizaciones sincrónicas de estado dentro de efectos sin cambiar los flujos de resultados rápidos ni alertas.

**Architecture:** `QuickBetResultSelect` usará `useOptimistic(result)` como estado visual temporal, tomando la prop del servidor como base. `Navbar` iniciará la carga de alertas al abrirse desde el manejador de clic del botón, eliminando el efecto que observa `alertsOpen`.

**Tech Stack:** React 19.2, Next.js 16, TypeScript, ESLint, Node.js test runner con `tsx`.

## Global Constraints

- No cambiar rutas API, acciones de servidor, datos de apuestas ni estilos visuales.
- `result` sigue siendo la fuente de verdad que React entrega como base a `useOptimistic`.
- Abrir el menú de alertas debe seguir cargando `/api/alerts/unread`; cerrarlo no debe hacer una solicitud.
- El conteo inicial de alertas permanece en su efecto asíncrono de montaje.
- `npm run lint` debe terminar sin errores.

---

### Task 1: Prueba de regresión para los patrones de hooks

**Files:**
- Create: `tests/react-effect-lint-regression.test.mts`

**Interfaces:**
- Consumes: fuentes de `src/components/bets/QuickBetResultSelect.tsx` y `src/components/layout/Navbar.tsx`.
- Produces: prueba que protege el uso de `useOptimistic` y la carga de alertas desde el manejador de clic.

- [ ] **Step 1: Escribir la prueba que falla**

Crear `tests/react-effect-lint-regression.test.mts`:

```ts
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const quickResultPath = new URL("../src/components/bets/QuickBetResultSelect.tsx", import.meta.url);
const navbarPath = new URL("../src/components/layout/Navbar.tsx", import.meta.url);

test("quick result uses the server result as an optimistic base without an effect sync", async () => {
  const source = await readFile(quickResultPath, "utf8");

  assert.match(source, /useOptimistic\(result\)/);
  assert.doesNotMatch(source, /useEffect\(\(\) => \{\s*setSelectedResult\(result\)/);
});

test("opening alerts loads unread alerts from the click handler, not an effect", async () => {
  const source = await readFile(navbarPath, "utf8");

  assert.match(source, /function handleAlertsToggle\(\)/);
  assert.match(source, /onClick=\{handleAlertsToggle\}/);
  assert.doesNotMatch(source, /useEffect\(\(\) => \{\s*if \(!alertsOpen\)/);
});
```

- [ ] **Step 2: Ejecutar la prueba para comprobar que falla**

Run: `npm test -- tests/react-effect-lint-regression.test.mts`

Expected: FAIL porque los componentes actuales no usan `useOptimistic` ni `handleAlertsToggle`.

### Task 2: Resultado rápido optimista sin efecto de sincronización

**Files:**
- Modify: `src/components/bets/QuickBetResultSelect.tsx`
- Test: `tests/react-effect-lint-regression.test.mts`

**Interfaces:**
- Consumes: prop `result: BetResultValue` como valor base del servidor y `updateBetResultAction(formData)`.
- Produces: estado visual `selectedResult` gestionado por `useOptimistic(result)`.

- [ ] **Step 1: Cambiar el hook de estado**

Reemplazar:

```ts
import { useEffect, useRef, useState, useTransition } from "react";
const [selectedResult, setSelectedResult] = useState(result);

useEffect(() => {
  setSelectedResult(result);
}, [result]);
```

por:

```ts
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
const [selectedResult, setSelectedResult] = useOptimistic(result);
```

Mantener `open` con `useState`. Dentro de `startTransition` de `updateResult`, llamar `setSelectedResult(nextResult)` antes de crear y enviar el `FormData`, de modo que la actualización optimista esté dentro de la transición:

```ts
startTransition(async () => {
  setSelectedResult(nextResult);
  const formData = new FormData();
  formData.set("betId", betId);
  formData.set("result", nextResult);
  await updateBetResultAction(formData);
});
```

- [ ] **Step 2: Ejecutar la prueba de regresión**

Run: `npm test -- tests/react-effect-lint-regression.test.mts`

Expected: la primera subprueba pasa; la segunda continúa fallando hasta completar Task 3.

### Task 3: Carga de alertas desde la interacción de apertura

**Files:**
- Modify: `src/components/layout/Navbar.tsx`
- Test: `tests/react-effect-lint-regression.test.mts`

**Interfaces:**
- Consumes: `alertsOpen: boolean`, `setAlertsOpen`, y `loadUnreadAlerts(): Promise<void>`.
- Produces: `handleAlertsToggle(): void`, usado por el botón `notifications-btn`.

- [ ] **Step 1: Añadir el manejador de alternancia**

Después de `markUnreadAlertsAsRead`, añadir:

```ts
function handleAlertsToggle() {
  const nextAlertsOpen = !alertsOpen;
  setAlertsOpen(nextAlertsOpen);

  if (nextAlertsOpen) {
    void loadUnreadAlerts();
  }
}
```

Eliminar completamente el efecto que comienza con `useEffect(() => { if (!alertsOpen)`. Reemplazar el `onClick` del botón `notifications-btn` por:

```tsx
onClick={handleAlertsToggle}
```

- [ ] **Step 2: Ejecutar la prueba de regresión**

Run: `npm test -- tests/react-effect-lint-regression.test.mts`

Expected: PASS con dos subpruebas aprobadas.

- [ ] **Step 3: Ejecutar verificaciones completas**

Run: `npm test && npx tsc --noEmit && npm run lint`

Expected: los tres comandos terminan con código `0`; `npm run lint` no informa `react-hooks/set-state-in-effect`.

- [ ] **Step 4: Verificar el diff y registrar el cambio**

Run: `git diff --check && git diff -- src/components/bets/QuickBetResultSelect.tsx src/components/layout/Navbar.tsx tests/react-effect-lint-regression.test.mts`

Expected: `git diff --check` no imprime salida y el diff solo contiene las modificaciones previstas.

```bash
git add src/components/bets/QuickBetResultSelect.tsx src/components/layout/Navbar.tsx tests/react-effect-lint-regression.test.mts
git commit -m "Fix state updates in React effects"
```

