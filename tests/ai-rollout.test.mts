import assert from "node:assert/strict";
import test from "node:test";
import { isInStableRollout, stableRolloutBucket } from "../src/lib/ai/ai-rollout";

test("ticket canary is stable and never requires sending the ticket id to a provider", () => {
  const bucket = stableRolloutBucket("ticket-private-id");
  assert.equal(stableRolloutBucket("ticket-private-id"), bucket);
  assert.ok(bucket >= 0 && bucket < 100);
  assert.equal(isInStableRollout("ticket-private-id", 0), false);
  assert.equal(isInStableRollout("ticket-private-id", 100), true);
});
