import assert from "node:assert/strict";
import test from "node:test";
import { getTicketFilePresentation } from "../src/lib/ticket-file-presentation";

test("PDF ticket files are offered as downloads instead of inline previews", () => {
  assert.equal(getTicketFilePresentation("application/pdf"), "download");
  assert.equal(getTicketFilePresentation("image/png"), "image");
});
