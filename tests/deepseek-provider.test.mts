import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { DeepSeekProvider, DeepSeekProviderError } from "../src/lib/ai/deepseek-provider";

const input = {
  task: "ticket_extraction" as const,
  model: "ignored-model",
  system: "Return JSON.",
  prompt: "BEGIN_UNTRUSTED_OCR\nBetano\nEND_UNTRUSTED_OCR",
  schemaName: "ticket_extraction",
  jsonSchema: { type: "object" },
  validate: (value: unknown) => z.object({ ok: z.boolean() }).parse(value),
};

test("DeepSeek request disables thinking and constrains JSON output", async () => {
  let requestBody: Record<string, unknown> = {};
  const fetchImpl = async (_url: string | URL | Request, init?: RequestInit) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({
      choices: [{ message: { content: "{\"ok\":true}" }, finish_reason: "stop" }],
      usage: { prompt_tokens: 10, prompt_cache_hit_tokens: 3, completion_tokens: 4, total_tokens: 14 },
    }), { status: 200 });
  };
  const provider = new DeepSeekProvider("secret", {}, fetchImpl as typeof fetch);
  const result = await provider.generateStructured(input);

  assert.equal(requestBody.model, "deepseek-v4-flash");
  assert.deepEqual(requestBody.thinking, { type: "disabled" });
  assert.deepEqual(requestBody.response_format, { type: "json_object" });
  assert.equal(requestBody.temperature, 0);
  assert.equal(requestBody.max_tokens, 4096);
  assert.deepEqual(result.data, { ok: true });
  assert.deepEqual(result.usage, { inputTokens: 10, cachedInputTokens: 3, outputTokens: 4 });
});

test("DeepSeek rejects empty and truncated JSON-mode responses as retryable", async () => {
  for (const payload of [
    { choices: [{ message: { content: "" }, finish_reason: "stop" }] },
    { choices: [{ message: { content: "{\"ok\":" }, finish_reason: "length" }] },
  ]) {
    const provider = new DeepSeekProvider("secret", {}, (async () => new Response(JSON.stringify(payload))) as typeof fetch);
    await assert.rejects(() => provider.generateStructured(input), (error: unknown) => {
      assert.ok(error instanceof DeepSeekProviderError);
      assert.equal(error.retryable, true);
      return true;
    });
  }
});

test("DeepSeek validates parsed JSON locally with Zod", async () => {
  const provider = new DeepSeekProvider("secret", {}, (async () => new Response(JSON.stringify({
    choices: [{ message: { content: "{\"ok\":\"yes\"}" }, finish_reason: "stop" }],
  }))) as typeof fetch);
  await assert.rejects(() => provider.generateStructured(input), (error: unknown) => {
    assert.ok(error instanceof DeepSeekProviderError);
    assert.equal(error.kind, "invalid_json");
    return true;
  });
});

test("DeepSeek retries only the approved HTTP categories and opens immediately for credentials or balance", async () => {
  for (const [status, retryable, opens] of [[429, true, false], [500, true, false], [503, true, false], [400, false, false], [401, false, true], [402, false, true], [422, false, false]] as const) {
    const provider = new DeepSeekProvider("secret", {}, (async () => new Response("{}", { status })) as typeof fetch);
    await assert.rejects(() => provider.generateStructured(input), (error: unknown) => {
      assert.ok(error instanceof DeepSeekProviderError);
      assert.equal(error.retryable, retryable);
      assert.equal(error.opensCircuitImmediately, opens);
      return true;
    });
  }
});

test("DeepSeek AbortController classifies request deadline as a timeout", async () => {
  const fetchImpl = (_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  });
  const provider = new DeepSeekProvider("secret", {}, fetchImpl as typeof fetch);
  await assert.rejects(() => provider.generateStructured({ ...input, timeoutMs: 1 }), (error: unknown) => {
    assert.ok(error instanceof DeepSeekProviderError);
    assert.equal(error.kind, "timeout");
    return true;
  });
});
