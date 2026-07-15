import test from "node:test";
import assert from "node:assert/strict";
import { resolveStorageProviderName } from "../src/lib/storage-config";

test("storage configuration rejects incomplete Supabase credentials", () => {
  assert.equal(resolveStorageProviderName(undefined, undefined), "local");
  assert.throws(
    () => resolveStorageProviderName("https://project.supabase.co", undefined),
    /SUPABASE_SECRET_KEY/
  );
  assert.equal(resolveStorageProviderName("https://project.supabase.co", "sb_secret_test"), "supabase");
});
