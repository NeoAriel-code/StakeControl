import test from "node:test";
import assert from "node:assert/strict";
import { getAuthSecret } from "../src/lib/auth-secret-config";
import {
  assertOcrProviderAllowed,
  resolveOcrProviderName,
} from "../src/lib/ocr-config";
import {
  assertStorageProviderAllowed,
  resolveStorageProviderName,
} from "../src/lib/storage-config";
import {
  assertAiProviderAllowed,
  resolveAiProviderName,
} from "../src/lib/ai/ai-provider-config";

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
  assert.throws(
    () => resolveStorageProviderName("https://project.supabase.co", undefined),
    /SUPABASE_SECRET_KEY/
  );
});

test("development may explicitly use local storage", () => {
  assert.equal(resolveStorageProviderName(undefined, undefined), "local");
  assert.equal(assertStorageProviderAllowed("local", "development"), "local");
});
