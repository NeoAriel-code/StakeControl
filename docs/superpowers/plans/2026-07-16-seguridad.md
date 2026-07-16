# Seguridad Implementation Plan

**Goal:** Sustituir límites locales y endurecer todas las entradas y salidas sensibles.

1. Añadir `RateLimitBucket` y migración; escribir pruebas de ventana compartida antes de sustituir `src/lib/rate-limit.ts`.
2. Añadir pruebas de fórmula CSV y prefijo `'` en `escapeCsvValue`.
3. Añadir límites y datetime ISO en `bet-schemas`, con pruebas Zod.
4. Configurar headers globales en `next.config.ts`; probar configuración.
5. Cambiar archivo privado a `attachment` con `nosniff` y prohibir PDF inline; cubrir la ruta.
6. Ejecutar lint, typecheck y suite completa.
