import assert from "node:assert/strict";
import test from "node:test";
import { OcrProcessingError } from "@/lib/ocr-errors";
import { saveTicketAndExtractText } from "@/lib/ticket-upload-utils";

const safeOcrMessage = "No se pudo procesar el ticket. Inténtalo de nuevo o completa los datos manualmente.";

test("OCR failure deletes the stored ticket and returns a safe error", async () => {
  const deletedReferences: string[] = [];
  await assert.rejects(() => saveTicketAndExtractText({
    storage: {
      savePrivateObject: async () => ({ reference: "private://tickets/user/image.jpg", byteLength: 3, mimeType: "image/jpeg" }),
      deletePrivateObject: async (reference: string) => { deletedReferences.push(reference); },
    },
    ocrService: { extractText: async () => { throw new OcrProcessingError(); } },
    input: {
      userId: "user-1",
      fileName: "ticket.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from([0xff, 0xd8, 0xff]),
    },
  }), (error: unknown) => {
    assert.equal((error as Error).message, safeOcrMessage);
    return true;
  });

  assert.deepEqual(deletedReferences, ["private://tickets/user/image.jpg"]);
});

test("unexpected OCR failure deletes the stored ticket", async () => {
  const deletedReferences: string[] = [];
  const ocrError = new Error("OCR provider unavailable");

  await assert.rejects(() => saveTicketAndExtractText({
    storage: {
      savePrivateObject: async () => ({ reference: "private://tickets/user/image.jpg", byteLength: 3, mimeType: "image/jpeg" }),
      deletePrivateObject: async (reference: string) => { deletedReferences.push(reference); },
    },
    ocrService: { extractText: async () => { throw ocrError; } },
    input: {
      userId: "user-1",
      fileName: "ticket.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from([0xff, 0xd8, 0xff]),
    },
  }), ocrError);

  assert.deepEqual(deletedReferences, ["private://tickets/user/image.jpg"]);
});
