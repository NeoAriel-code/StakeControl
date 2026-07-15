import assert from "node:assert/strict";
import test from "node:test";
import { validateTicketFile } from "@/lib/ticket-upload-utils";

test("ticket validation rejects PDF before storage", () => {
  assert.throws(
    () => validateTicketFile(new File(["%PDF-"], "ticket.pdf", { type: "application/pdf" })),
    /JPG, PNG o WEBP/
  );
});
