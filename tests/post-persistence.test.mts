import assert from "node:assert/strict";
import test from "node:test";
import { persistThenRunBestEffort } from "../src/lib/post-persistence";

test("a secondary task failure never turns a completed persistence into an error", async () => {
  const secondaryError = new Error("alerts unavailable");
  const reported: unknown[] = [];

  const saved = await persistThenRunBestEffort(
    async () => ({ id: "bet-1" }),
    async () => {
      throw secondaryError;
    },
    (error) => reported.push(error)
  );

  assert.deepEqual(saved, { id: "bet-1" });
  assert.deepEqual(reported, [secondaryError]);
});
