import test from "node:test";
import assert from "node:assert/strict";
import { getAiModelConfig } from "../src/lib/ai/ai-config";

test("AI model config uses supported defaults when no model is configured", () => {
  assert.deepEqual(getAiModelConfig({}), {
    ticketPrimary: "gpt-5-mini",
    ticketFallback: "gpt-4.1-mini",
    reportPrimary: "gpt-5-mini",
    reportFallback: "gpt-4.1-mini",
  });
});

test("AI model config keeps explicit model overrides", () => {
  const config = getAiModelConfig({
    AI_TICKET_PRIMARY_MODEL: "custom-primary",
    AI_TICKET_FALLBACK_MODEL: "custom-fallback",
  });

  assert.equal(config.ticketPrimary, "custom-primary");
  assert.equal(config.ticketFallback, "custom-fallback");
});
