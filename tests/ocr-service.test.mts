import test from "node:test";
import assert from "node:assert/strict";
import { MockOcrProvider } from "../src/lib/ocr-providers/MockOcrProvider";
import { structureMockBetTicket } from "../src/lib/mock-ticket-parser";

test("MockOcrProvider returns ticket text with expected fields", async () => {
  const provider = new MockOcrProvider();
  const rawText = await provider.extractText("local://tickets/user/demo-ticket.jpg");

  assert.match(rawText, /Sportsbook:/);
  assert.match(rawText, /Stake:/);
  assert.match(rawText, /Cuota:/);
});

test("mock ticket parser structures mocked OCR text", async () => {
  const provider = new MockOcrProvider();
  const rawText = await provider.extractText("local://tickets/user/demo-ticket.jpg");
  const extracted = structureMockBetTicket(rawText);

  assert.equal(extracted.event.length > 0, true);
  assert.equal(extracted.stake > 0, true);
  assert.equal(extracted.odds > 1, true);
  assert.equal(extracted.confidenceScore >= 0 && extracted.confidenceScore <= 1, true);
});
