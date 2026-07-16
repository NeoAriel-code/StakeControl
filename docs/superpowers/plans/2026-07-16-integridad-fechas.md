# Integridad de fechas de apuestas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persistir fechas de tickets únicamente cuando tengan una fuente trazable, sin fabricar fechas actuales durante extracción o revisión.

**Architecture:** El modelo `Bet` separará la colocación del ticket y el inicio del evento, y guardará la procedencia de cada fecha y de la moneda mediante un enum Prisma. Las capas Zod, parsers y acciones preservarán `null`; las pantallas tratarán esa ausencia de forma explícita.

**Tech Stack:** Next.js 16, TypeScript, Zod 4, Prisma 7 con SQLite, node:test y tsx.

## Global Constraints

- `placedAt` y `eventStartAt` pueden ser `null`; ningún fallback puede usar `new Date()` para rellenarlos.
- Las únicas procedencias son `USER`, `OCR`, `INFERRED` y `UNKNOWN`.
- Una fecha o moneda editada por la persona se persiste con procedencia `USER`.
- Conservar los cambios ajenos del árbol de trabajo y no incluirlos en commits de esta etapa.

---

### Task 1: Modelo Prisma y contratos de validación

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260716000000_add_bet_date_integrity/migration.sql`
- Modify: `src/lib/bet-schemas.ts`
- Modify: `src/lib/ticket-extraction.ts`
- Modify: `tests/validation-schemas.test.mts`

**Interfaces:**
- Produces: enum `FieldSource`, campos `Bet.placedAt?`, `Bet.eventStartAt?`, `Bet.placedAtSource?`, `Bet.eventStartAtSource?`, `Bet.currencySource?`.
- Produces: entradas Zod opcionales `placedAt`, `eventStartAt` y las tres procedencias.

- [ ] **Step 1: Write the failing schema test**

```ts
test("betFormSchema preserves missing dates and accepts field sources", () => {
  const parsed = betFormSchema.parse({
    event: "Evento", betType: BetType.SINGLE, stake: "1000", odds: "1.8",
    currency: "CLP", result: BetResult.PENDING, netProfit: "0", placedAt: "", eventStartAt: "",
  });
  assert.equal(parsed.placedAt, undefined);
  assert.equal(parsed.eventStartAt, undefined);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/validation-schemas.test.mts`
Expected: FAIL because empty `placedAt` is currently required.

- [ ] **Step 3: Implement migration and validation contracts**

```prisma
enum FieldSource { USER OCR INFERRED UNKNOWN }

model Bet {
  placedAt           DateTime?
  eventStartAt       DateTime?
  placedAtSource     FieldSource?
  eventStartAtSource FieldSource?
  currencySource     FieldSource?
}
```

Create a SQLite table-rebuild migration that copies all columns, makes `placedAt` nullable, adds `eventStartAt`, adds the three nullable source columns, and backfills `UNKNOWN` only when the corresponding prior `placedAt`/`currency` exists. Change Zod date fields to the existing optional trimmed-string behavior and validate sources with the `FieldSource` enum.

- [ ] **Step 4: Generate Prisma client and run schema tests**

Run: `npm run prisma:generate && npm test -- tests/validation-schemas.test.mts`
Expected: PASS.

### Task 2: Extracción, revisión y persistencia sin fechas inventadas

**Files:**
- Modify: `src/lib/ai/schemas/ticket-extraction.schema.ts`
- Modify: `src/lib/ai/ticket-parser.ts`
- Modify: `src/lib/mock-ticket-parser.ts`
- Modify: `src/lib/ticket-actions.ts`
- Modify: `src/components/tickets/TicketReviewForm.tsx`
- Modify: `src/components/bets/BetForm.tsx`
- Modify: `src/lib/bet-actions.ts`
- Modify: `tests/ai-ticket-routing.test.mts`
- Modify: `tests/validation-schemas.test.mts`

**Interfaces:**
- Consumes: `FieldSource` and optional date contracts from Task 1.
- Produces: `ExtractedBetTicket` with optional dates and per-field source values.
- Produces: `buildBetPayload` and ticket-finalization data with `Date | null` and source fields.

- [ ] **Step 1: Write failing extraction tests**

```ts
test("ticket routing keeps a missing placedAt null instead of using the current time", async () => {
  const result = await parseTicketWithRouting("Ticket OCR", providerReturningNoDate);
  assert.equal(result.ticket.placedAt, undefined);
  assert.equal(result.ticket.placedAtSource, "UNKNOWN");
});

test("ticket routing marks an explicit currency as OCR and a preference fallback as INFERRED", async () => {
  assert.equal(explicit.ticket.currencySource, "OCR");
  assert.equal(ambiguous.ticket.currencySource, "INFERRED");
});
```

- [ ] **Step 2: Run extraction tests to verify they fail**

Run: `npm test -- tests/ai-ticket-routing.test.mts`
Expected: FAIL because the parser currently fills `placedAt` using the current time and has no source properties.

- [ ] **Step 3: Implement null-preserving extraction and review**

```ts
placedAt: parsed.placedAt ?? undefined,
eventStartAt: parsed.eventStartAt ?? undefined,
placedAtSource: parsed.placedAt ? FieldSource.OCR : FieldSource.UNKNOWN,
eventStartAtSource: parsed.eventStartAt ? FieldSource.OCR : FieldSource.UNKNOWN,
currencySource: currencyWasAssumed ? FieldSource.INFERRED : FieldSource.OCR,
```

Remove `formatCurrentDateTime` from all date fallbacks and from the mock parser. Add an optional `eventStartAt` datetime input to both forms. In the review action compare submitted values to the stored extraction: retain its source unchanged when its value is unchanged, otherwise assign `USER`; manual create/update always assign `USER` to present dates and currency. Convert string dates only when defined, otherwise persist `null`.

- [ ] **Step 4: Run focused tests to verify they pass**

Run: `npm test -- tests/ai-ticket-routing.test.mts tests/validation-schemas.test.mts`
Expected: PASS.

### Task 3: Lectura segura de datos sin fecha y verificación final

**Files:**
- Modify: `src/app/bets/page.tsx`
- Modify: `src/app/bets/[id]/page.tsx`
- Modify: `src/app/bets/[id]/edit/page.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/lib/bet-csv-export.ts`
- Modify: `src/lib/dashboard-metrics.ts`
- Modify: `src/lib/responsible-gaming.ts`
- Modify: `src/lib/ai-responsible-analysis-service.ts`
- Modify: relevant tests that construct a bet with `placedAt`

**Interfaces:**
- Consumes: nullable `Bet.placedAt` from Task 1.
- Produces: pages, exports and metrics that never dereference a missing date.

- [ ] **Step 1: Write failing CSV regression test**

```ts
test("CSV exports an empty date for a bet without placedAt", () => {
  const csv = buildBetsCsv([{ ...baseBet, placedAt: null }], "FREE");
  assert.match(csv.split("\n")[1]!, /^""/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/bet-csv-export.test.mts`
Expected: FAIL because `toISOString()` is called on `null`.

- [ ] **Step 3: Implement explicit null handling**

```ts
const datedBets = bets.filter((bet): bet is typeof bet & { placedAt: Date } => bet.placedAt !== null);
const placedAt = bet.placedAt ? bet.placedAt.toISOString() : "";
```

Use the filtered collection for chronological metrics and date-based responsible-gaming queries; retain all bets for money totals. Show `Sin fecha registrada` in detail/edit display and put null dates after dated records in listing ordering.

- [ ] **Step 4: Run focused test, lint, typecheck and full tests**

Run: `npm test -- tests/bet-csv-export.test.mts && npm run lint && npx tsc --noEmit && npm test`
Expected: all commands exit 0.

- [ ] **Step 5: Commit the implementation**

```bash
git add prisma src tests docs/superpowers/plans/2026-07-16-integridad-fechas.md
git commit -m "Add bet date integrity"
```
