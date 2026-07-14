import test from "node:test";
import assert from "node:assert/strict";
import { getStructuredOutputText } from "../src/lib/ai/openai-provider";

test("getStructuredOutputText supports the Responses API output content", () => {
  const output = getStructuredOutputText({
    output: [
      {
        content: [{ type: "output_text", text: '{"confidenceScore":0.9}' }],
      },
    ],
  });

  assert.equal(output, '{"confidenceScore":0.9}');
});

test("getStructuredOutputText keeps support for the output_text shortcut", () => {
  assert.equal(getStructuredOutputText({ output_text: '{"confidenceScore":0.9}' }), '{"confidenceScore":0.9}');
});
