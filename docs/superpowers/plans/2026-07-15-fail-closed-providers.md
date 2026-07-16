# Fail-Closed Providers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reject insecure production configuration, remove fabricated OCR output, return safe OCR failures, and temporarily reject PDF ticket uploads.

**Architecture:** Provider configuration becomes explicit and throws on missing, unknown, or forbidden production values instead of selecting a fallback. OCR providers expose one safe domain error to the upload action; the action compensates by removing a just-stored object. Existing Google Vision, OpenAI API, and Supabase integrations remain unchanged for valid configuration.

**Tech Stack:** Next.js 16 server actions, TypeScript, Node test runner with tsx, Prisma, Google Cloud Vision, OpenAI API, Supabase Storage.

## Global Constraints

- `AUTH_SECRET` is mandatory in every environment; no embedded default secret is permitted.
- In production, OCR must not use `mock` or `tesseract`, AI must not use `mock`, and storage must not use `local`.
- Google Vision, OpenAI API, and Supabase Storage behavior with valid production configuration remains intact.
- OCR errors displayed to users must not include provider responses, credentials, object references, or internal paths.
- Upload accepts only JPEG, PNG, and WEBP; PDF conversion is out of scope.

---

## File Structure

- Modify `src/lib/auth.ts`: require a nonblank authentication secret.
- Modify `src/lib/ocr-config.ts`: resolve explicit OCR names and validate production safety.
- Modify `src/lib/ocr-service.ts`: define `OcrProcessingError` and construct only validated providers.
- Modify `src/lib/ocr-providers/GoogleVisionOcrProvider.ts`: throw safe errors rather than using mock text.
- Modify `src/lib/storage-config.ts` and `src/lib/storage.ts`: make storage selection explicit and production-safe.
- Create `src/lib/ai/ai-provider-config.ts`: one provider-name resolver shared by ticket extraction and behavior analysis.
- Modify `src/lib/ai/ticket-parser.ts` and `src/lib/ai/behavior-analysis.ts`: obtain the AI provider through the shared validated resolver.
- Modify `src/lib/ticket-actions.ts`: reject PDF, map safe OCR failures, and delete a stored object on OCR failure.
- Modify `src/components/tickets/TicketUploadForm.tsx` and `README.md`: remove PDF from user-facing support documentation.
- Modify/add `tests/*.test.mts`: preserve the regression suite with unit tests for each fail-closed boundary.

### Task 1: Authentication and provider configuration contracts

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/lib/ocr-config.ts`
- Modify: `src/lib/storage-config.ts`
- Create: `src/lib/ai/ai-provider-config.ts`
- Test: `tests/provider-config.test.mts`

**Interfaces:**
- Produces `getAuthSecret(environment?: Record<string, string | undefined>): string`.
- Produces `resolveOcrProviderName(value?: string): OcrProviderName`, which throws for absent/unknown values.
- Produces `assertOcrProviderAllowed(name: OcrProviderName, nodeEnv?: string): OcrProviderName`.
- Produces `resolveStorageProviderName(url?: string, key?: string): StorageProviderName`, which throws for incomplete credentials.
- Produces `assertStorageProviderAllowed(name: StorageProviderName, nodeEnv?: string): StorageProviderName`.
- Produces `resolveAiProviderName(value?: string): "mock" | "openai"` and `assertAiProviderAllowed(name, nodeEnv?)`.

- [ ] **Step 1: Write failing configuration tests**

```ts
test("authentication requires a configured secret", () => {
  assert.throws(() => getAuthSecret({}), /AUTH_SECRET must be configured/);
  assert.equal(getAuthSecret({ AUTH_SECRET: "secret" }), "secret");
});

test("production rejects local and mock providers", () => {
  assert.throws(() => assertOcrProviderAllowed("mock", "production"), /OCR_PROVIDER/);
  assert.throws(() => assertOcrProviderAllowed("tesseract", "production"), /OCR_PROVIDER/);
  assert.throws(() => assertAiProviderAllowed("mock", "production"), /AI_PROVIDER/);
  assert.throws(() => assertStorageProviderAllowed("local", "production"), /storage/);
  assert.equal(assertOcrProviderAllowed("google_vision", "production"), "google_vision");
  assert.equal(assertAiProviderAllowed("openai", "production"), "openai");
  assert.equal(assertStorageProviderAllowed("supabase", "production"), "supabase");
});

test("configuration does not silently select defaults", () => {
  assert.throws(() => resolveOcrProviderName(undefined), /OCR_PROVIDER/);
  assert.throws(() => resolveAiProviderName("unknown"), /AI_PROVIDER/);
  assert.throws(() => resolveStorageProviderName("https://project.supabase.co", undefined), /SUPABASE_SECRET_KEY/);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --import tsx --test tests/provider-config.test.mts`

Expected: FAIL because the exported contract or fail-closed behavior does not exist.

- [ ] **Step 3: Implement the minimal explicit resolvers**

```ts
export function getAuthSecret(environment: Record<string, string | undefined> = process.env) {
  const secret = environment.AUTH_SECRET?.trim();
  if (!secret) throw new Error("AUTH_SECRET must be configured.");
  return secret;
}

export function assertAiProviderAllowed(name: "mock" | "openai", nodeEnv = process.env.NODE_ENV) {
  if (nodeEnv === "production" && name === "mock") {
    throw new Error("AI_PROVIDER=openai must be configured in production.");
  }
  return name;
}
```

Implement analogous explicit OCR/storage resolvers: trim values, reject unknown/absent values, and reject `mock`/`tesseract` OCR plus `local` storage in production. Preserve explicit mock/local choices outside production.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `node --import tsx --test tests/provider-config.test.mts`

Expected: PASS with all provider-contract assertions green.

- [ ] **Step 5: Commit the configuration contract**

```bash
git add src/lib/auth.ts src/lib/ocr-config.ts src/lib/storage-config.ts src/lib/ai/ai-provider-config.ts tests/provider-config.test.mts
git commit -m "Fail closed provider configuration"
```

### Task 2: Use the validated configuration factories

**Files:**
- Modify: `src/lib/ocr-service.ts`
- Modify: `src/lib/storage.ts`
- Modify: `src/lib/ai/ticket-parser.ts`
- Modify: `src/lib/ai/behavior-analysis.ts`
- Test: `tests/provider-factories.test.mts`

**Interfaces:**
- Consumes the resolvers and guards from Task 1.
- Produces `OcrProcessingError`, exported from `src/lib/ocr-service.ts`.
- `createOcrProvider`, `createStorageService`, ticket routing, and behavior analysis validate their selected provider before instantiation.

- [ ] **Step 1: Write failing factory tests**

```ts
test("OCR factory refuses mock configuration in production", () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  process.env.OCR_PROVIDER = "mock";
  assert.throws(() => createOcrProvider(), /OCR_PROVIDER/);
  process.env.NODE_ENV = previous;
});

test("storage factory refuses local storage in production", () => {
  assert.throws(() => createStorageService({ NODE_ENV: "production" }), /storage/);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --import tsx --test tests/provider-factories.test.mts`

Expected: FAIL because factories currently instantiate mock/local services.

- [ ] **Step 3: Wire factories to the validated contracts**

```ts
export class OcrProcessingError extends Error {
  constructor() {
    super("No se pudo procesar el ticket. Inténtalo de nuevo o completa los datos manualmente.");
    this.name = "OcrProcessingError";
  }
}

export function getConfiguredOcrProviderName() {
  return assertOcrProviderAllowed(resolveOcrProviderName(process.env.OCR_PROVIDER));
}
```

Make `createStorageService` use the explicit storage resolver and guard before selecting Supabase or local storage. Replace the duplicated `AI_PROVIDER === "openai" ? ... : MockAiProvider` branches with one shared, validated provider factory while preserving test injection parameters in parsing and analysis functions.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `node --import tsx --test tests/provider-factories.test.mts`

Expected: PASS with production mock/local construction rejected.

- [ ] **Step 5: Commit factory hardening**

```bash
git add src/lib/ocr-service.ts src/lib/storage.ts src/lib/ai/ticket-parser.ts src/lib/ai/behavior-analysis.ts tests/provider-factories.test.mts
git commit -m "Validate provider factories"
```

### Task 3: Return safe Google Vision OCR failures

**Files:**
- Modify: `src/lib/ocr-providers/GoogleVisionOcrProvider.ts`
- Test: `tests/google-vision-ocr-provider.test.mts`

**Interfaces:**
- Consumes `OcrProcessingError` from `src/lib/ocr-service.ts`.
- `GoogleVisionOcrProvider.extractText(fileUrl: string): Promise<string>` resolves only actual recognized text or rejects with `OcrProcessingError`.

- [ ] **Step 1: Write failing OCR provider tests**

```ts
test("Google Vision rejects an unsupported file with a safe OCR error", async () => {
  const provider = new GoogleVisionOcrProvider({ getStoredObject: async () => ({ mimeType: "application/pdf", buffer: Buffer.from("%PDF-") }) });
  await assert.rejects(() => provider.extractText("private://ticket.pdf"), (error: unknown) => {
    assert.equal(error instanceof OcrProcessingError, true);
    assert.equal((error as Error).message, "No se pudo procesar el ticket. Inténtalo de nuevo o completa los datos manualmente.");
    return true;
  });
});

test("Google Vision rejects an empty recognition result without mock text", async () => {
  // Inject a client returning an empty annotation and assert OcrProcessingError.
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --import tsx --test tests/google-vision-ocr-provider.test.mts`

Expected: FAIL because the provider currently returns fallback mock text.

- [ ] **Step 3: Remove the mock fallback and normalize provider errors**

```ts
if (!SUPPORTED_IMAGE_MIME_TYPES.has(storedObject.mimeType)) {
  throw new OcrProcessingError();
}

if (!extractedText) {
  throw new OcrProcessingError();
}
```

Delete `MockOcrProvider`, `fallbackProvider`, and `buildFallbackText` from this provider. Wrap storage, credential, and Vision invocation failures with `throw new OcrProcessingError()`; do not include the caught error as message or cause exposed to callers. Add constructor dependency injection only for storage/client seams needed by the test, retaining default real Google Vision construction.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `node --import tsx --test tests/google-vision-ocr-provider.test.mts`

Expected: PASS; no assertion may find mock ticket fields or provider details in the error.

- [ ] **Step 5: Commit safe OCR failures**

```bash
git add src/lib/ocr-providers/GoogleVisionOcrProvider.ts tests/google-vision-ocr-provider.test.mts
git commit -m "Return safe Google Vision OCR errors"
```

### Task 4: Reject PDF and compensate failed OCR uploads

**Files:**
- Modify: `src/lib/ticket-actions.ts`
- Modify: `src/components/tickets/TicketUploadForm.tsx`
- Test: `tests/ticket-upload-validation.test.mts`
- Test: `tests/ticket-upload-action.test.mts`

**Interfaces:**
- `validateTicketFile` and `validateFileSignature` accept only `image/jpeg`, `image/png`, and `image/webp`.
- `uploadTicketAction` maps `OcrProcessingError` to its safe message and calls `storage.deletePrivateObject(reference)` after a successfully stored object fails OCR.

- [ ] **Step 1: Write failing upload tests**

```ts
test("ticket validation rejects PDF before storage", () => {
  assert.throws(
    () => validateTicketFile(new File(["%PDF-"], "ticket.pdf", { type: "application/pdf" })),
    /JPG, PNG o WEBP/
  );
});

test("OCR failure deletes the stored ticket and returns a safe error", async () => {
  // Inject authenticated user, storage save/delete spies, and an OCR service that rejects OcrProcessingError.
  const result = await uploadTicketAction({}, formData);
  assert.equal(result.error, "No se pudo procesar el ticket. Inténtalo de nuevo o completa los datos manualmente.");
  assert.deepEqual(deletedReferences, ["private://tickets/user/image.png"]);
});
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `node --import tsx --test tests/ticket-upload-validation.test.mts tests/ticket-upload-action.test.mts`

Expected: FAIL because PDF remains allowed and upload does not compensate an OCR failure.

- [ ] **Step 3: Implement upload validation and cleanup**

```ts
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

let storedReference: string | undefined;
// assign storedReference immediately after savePrivateObject succeeds
// in catch: if (storedReference) await storage.deletePrivateObject(storedReference).catch(() => undefined)
```

Export file validation as a narrowly scoped testable helper or inject upload dependencies through an optional server-only argument. Preserve the existing generic fallback message for non-OCR errors; for `OcrProcessingError`, return only `error.message`. Remove PDF-specific UI handling, remove `FileText`, and change `accept` plus helper copy to JPG, PNG and WEBP.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run: `node --import tsx --test tests/ticket-upload-validation.test.mts tests/ticket-upload-action.test.mts`

Expected: PASS; the delete spy receives the saved reference exactly once after OCR failure.

- [ ] **Step 5: Commit upload fail-closed behavior**

```bash
git add src/lib/ticket-actions.ts src/components/tickets/TicketUploadForm.tsx tests/ticket-upload-validation.test.mts tests/ticket-upload-action.test.mts
git commit -m "Reject PDF ticket uploads"
```

### Task 5: Align operational documentation and verify the application

**Files:**
- Modify: `README.md`
- Modify: `tests/ocr-service.test.mts`
- Modify: `tests/storage-config.test.mts`

**Interfaces:**
- Documentation states that production requires Google Vision, OpenAI API, Supabase Storage, and `AUTH_SECRET`; it does not claim PDF or mock fallbacks.

- [ ] **Step 1: Write failing documentation-alignment assertions**

```ts
test("OCR configuration has no implicit mock fallback", () => {
  assert.throws(() => resolveOcrProviderName(undefined), /OCR_PROVIDER/);
  assert.throws(() => resolveOcrProviderName("unknown-provider"), /OCR_PROVIDER/);
});

test("storage configuration rejects incomplete Supabase credentials", () => {
  assert.throws(() => resolveStorageProviderName("https://project.supabase.co", undefined), /SUPABASE_SECRET_KEY/);
});
```

- [ ] **Step 2: Run the affected tests to verify they fail or reflect the new contract**

Run: `node --import tsx --test tests/ocr-service.test.mts tests/storage-config.test.mts`

Expected: FAIL until outdated fallback assertions are replaced.

- [ ] **Step 3: Update test expectations and README**

Replace README claims that PDFs use mock fallback or that failed OCR continues with fabricated text. Document production variables `AUTH_SECRET`, `OCR_PROVIDER=google_vision`, `AI_PROVIDER=openai`, `SUPABASE_URL`, and `SUPABASE_SECRET_KEY`; state PDFs are not accepted. Replace mock/default assertions in the two test files with the explicit rejection assertions from Step 1.

- [ ] **Step 4: Run complete verification**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build && git diff --check`

Expected: all commands exit 0 with no TypeScript, lint, test, build, or whitespace errors.

- [ ] **Step 5: Commit documentation and verification updates**

```bash
git add README.md tests/ocr-service.test.mts tests/storage-config.test.mts
git commit -m "Document fail closed ticket processing"
```

## Self-Review

- Spec coverage: Tasks 1–2 remove secret and provider fallbacks; Task 3 removes fictitious Google Vision output and types the failure; Task 4 disables PDF and cleans up failed OCR uploads; Task 5 updates the documented operating contract and runs full verification.
- Placeholder scan: no unresolved requirements or incomplete implementation steps remain.
- Type consistency: all OCR code imports `OcrProcessingError` from `src/lib/ocr-service.ts`; all configuration entry points use the Task 1 resolver and guard signatures.
