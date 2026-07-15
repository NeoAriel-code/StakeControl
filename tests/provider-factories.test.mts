import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createConfiguredAiProvider } from "../src/lib/ai/ai-provider-factory";

const require = createRequire(import.meta.url);
const serverOnlyPath = require.resolve("server-only");
require.cache[serverOnlyPath] = {
  id: serverOnlyPath,
  filename: serverOnlyPath,
  loaded: true,
  exports: {},
  children: [],
  paths: [],
} as unknown as NodeModule;

const { createOcrProvider } = await import("../src/lib/ocr-service");
const { createStorageService } = await import("../src/lib/storage");

test("OCR factory refuses mock configuration in production", () => {
  const environment = process.env as Record<string, string | undefined>;
  const previousNodeEnv = process.env.NODE_ENV;
  const previousProvider = process.env.OCR_PROVIDER;

  try {
    environment.NODE_ENV = "production";
    environment.OCR_PROVIDER = "mock";

    assert.throws(() => createOcrProvider(), /OCR_PROVIDER/);
  } finally {
    environment.NODE_ENV = previousNodeEnv;
    environment.OCR_PROVIDER = previousProvider;
  }
});

test("storage factory refuses local storage in production", () => {
  assert.throws(() => createStorageService({ NODE_ENV: "production" }), /storage/);
});

test("storage factory constructs the Supabase client with complete server credentials", () => {
  const storageService = createStorageService({
    NODE_ENV: "production",
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_SECRET_KEY: "sb_secret_test",
  });

  assert.ok(storageService);
});

test("AI factory refuses mock configuration in production", () => {
  assert.throws(
    () => createConfiguredAiProvider({ NODE_ENV: "production", AI_PROVIDER: "mock" }),
    /AI_PROVIDER/
  );
});
