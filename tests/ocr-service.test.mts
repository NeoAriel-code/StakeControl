import test from "node:test";
import assert from "node:assert/strict";
import { MockOcrProvider } from "../src/lib/ocr-providers/MockOcrProvider";
import { structureMockBetTicket } from "../src/lib/mock-ticket-parser";
import { resolveOcrProviderName } from "../src/lib/ocr-config";

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
  assert.equal(extracted.legs.length, 1);
  assert.equal(extracted.legs[0]?.event, extracted.event);
});

test("OCR provider configuration requires an explicit supported provider", () => {
  assert.equal(resolveOcrProviderName("tesseract"), "tesseract");
  assert.equal(resolveOcrProviderName(" TESSERACT "), "tesseract");
  assert.equal(resolveOcrProviderName("google_vision"), "google_vision");
  assert.throws(() => resolveOcrProviderName("unknown-provider"), /OCR_PROVIDER/);
  assert.throws(() => resolveOcrProviderName(undefined), /OCR_PROVIDER/);
});
