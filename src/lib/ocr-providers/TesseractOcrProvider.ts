import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { OcrProvider } from "@/lib/ocr-service";
import { getStorageService } from "@/lib/storage";
import { MockOcrProvider } from "@/lib/ocr-providers/MockOcrProvider";

const execFileAsync = promisify(execFile);
const SUPPORTED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function extensionForMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return ".bin";
  }
}

function buildFallbackText(reason: string, fallbackText: string) {
  return [
    "Aviso OCR: Tesseract no pudo procesar el ticket localmente.",
    `Motivo: ${reason}`,
    "Se usaron datos mock para mantener el flujo de revisión. Revisa manualmente todos los campos antes de guardar.",
    "",
    fallbackText,
  ].join("\n");
}

export class TesseractOcrProvider implements OcrProvider {
  private readonly fallbackProvider = new MockOcrProvider();

  async extractText(fileUrl: string): Promise<string> {
    const fallbackText = await this.fallbackProvider.extractText(fileUrl);

    try {
      const storedObject = await getStorageService().getPrivateObject(fileUrl);

      if (!SUPPORTED_IMAGE_MIME_TYPES.has(storedObject.mimeType)) {
        return buildFallbackText(
          `Formato ${storedObject.mimeType} no soportado por el OCR local experimental.`,
          fallbackText
        );
      }

      const directory = await mkdtemp(path.join(tmpdir(), "stakecontrol-tesseract-"));
      const inputPath = path.join(directory, `ticket${extensionForMimeType(storedObject.mimeType)}`);

      try {
        await writeFile(inputPath, storedObject.buffer);

        const { stdout } = await execFileAsync(
          process.env.TESSERACT_BIN || "tesseract",
          [inputPath, "stdout", "-l", process.env.TESSERACT_LANG || "spa+eng", "--psm", "6"],
          {
            timeout: 20_000,
            maxBuffer: 1024 * 1024,
          }
        );
        const extractedText = stdout.trim();

        if (!extractedText) {
          return buildFallbackText("Tesseract no devolvió texto legible.", fallbackText);
        }

        return extractedText;
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Error desconocido ejecutando Tesseract.";
      return buildFallbackText(reason, fallbackText);
    }
  }
}
