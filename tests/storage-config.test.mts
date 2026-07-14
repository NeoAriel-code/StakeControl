import test from "node:test";
import assert from "node:assert/strict";
import { resolveStorageProviderName } from "../src/lib/storage-config";

test("storage config uses Supabase only when both server credentials are configured", () => {
  assert.equal(resolveStorageProviderName(undefined, undefined), "local");
  assert.equal(resolveStorageProviderName("https://project.supabase.co", undefined), "local");
  assert.equal(resolveStorageProviderName("https://project.supabase.co", "sb_secret_test"), "supabase");
});
