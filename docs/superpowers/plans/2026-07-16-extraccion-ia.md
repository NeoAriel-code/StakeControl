# Extracción IA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer la extracción de tickets tolerante a datos ausentes y resistente a fallos de IA y prompt injection.

**Architecture:** El esquema estructurado representa como `null` los datos no detectados. `parseTicketWithRouting` prueba primario y fallback con el mismo validador; ambos fallos producen exclusivamente un borrador para revisión humana. El OCR se entrega como bloque de datos no confiables delimitado.

**Tech Stack:** TypeScript, Zod, OpenAI Responses API, node:test con tsx.

## Global Constraints

- Un único intento con `ticketPrimary` y un único fallback con `ticketFallback`.
- Error, timeout, JSON inválido y confianza menor a `0.85` activan fallback.
- Nunca crear `Bet` sin confirmar el formulario de revisión.

### Task 1: Esquema tolerante a ausencia

**Files:** `src/lib/ai/schemas/ticket-extraction.schema.ts`, `src/lib/ticket-extraction.ts`, `tests/validation-schemas.test.mts`.

- [ ] Escribir pruebas que acepten `null` para todos los campos de dominio no detectados.
- [ ] Ejecutar `npm test -- tests/validation-schemas.test.mts` y observar el fallo.
- [ ] Convertir campos de dominio a nullable y normalizar el borrador para revisión.
- [ ] Repetir la prueba enfocada y confirmar que pasa.

### Task 2: Fallback seguro y delimitación OCR

**Files:** `src/lib/ai/ticket-parser.ts`, `tests/ai-ticket-routing.test.mts`.

- [ ] Escribir pruebas para fallback después de error, timeout simulado, JSON inválido y baja confianza; verificar delimitadores de OCR no confiable.
- [ ] Ejecutar `npm test -- tests/ai-ticket-routing.test.mts` y observar los fallos de rutas actuales.
- [ ] Encadenar primario y fallback bajo un único validador; convertir los dos fallos en borrador humano y encerrar OCR entre delimitadores explícitos.
- [ ] Repetir la prueba enfocada y confirmar que pasa.

### Task 3: Verificación integrada

**Files:** tests modificados y rutas de revisión existentes.

- [ ] Confirmar que la acción de revisión sigue siendo la única ruta que crea `Bet`.
- [ ] Ejecutar `npm run lint`, `npx tsc --noEmit`, `npm test` y `git diff --check`.
- [ ] Commit con `git commit -m "Harden AI ticket extraction"`.
