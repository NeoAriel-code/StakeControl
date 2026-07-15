import test from "node:test";
import assert from "node:assert/strict";
import { GoogleVisionOcrProvider } from "@/lib/ocr-providers/GoogleVisionOcrProvider";

const safeErrorMessage = "No se pudo procesar el ticket. Inténtalo de nuevo o completa los datos manualmente.";

test("Google Vision rejects an unsupported file with a safe OCR error", async () => {
  const provider = new GoogleVisionOcrProvider({
    getStoredObject: async () => ({ mimeType: "application/pdf", buffer: Buffer.from("%PDF-"), fileName: "ticket.pdf" }),
  });

  await assert.rejects(() => provider.extractText("private://ticket.pdf"), (error: unknown) => {
    assert.equal((error as Error).name, "OcrProcessingError");
    assert.equal((error as Error).message, safeErrorMessage);
    return true;
  });
});

test("Google Vision rejects an empty recognition result without mock text", async () => {
  const provider = new GoogleVisionOcrProvider({
    getStoredObject: async () => ({ mimeType: "image/png", buffer: Buffer.from("image"), fileName: "ticket.png" }),
    client: {
      documentTextDetection: async () => [{}],
    },
  });

  await assert.rejects(() => provider.extractText("private://ticket.png"), (error: unknown) => {
    assert.equal((error as Error).name, "OcrProcessingError");
    assert.equal((error as Error).message, safeErrorMessage);
    assert.doesNotMatch((error as Error).message, /Sportsbook|Stake|Cuota|Google Vision/i);
    return true;
  });
});
