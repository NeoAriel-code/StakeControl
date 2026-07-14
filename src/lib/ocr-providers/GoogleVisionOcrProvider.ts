import "server-only";

import { ImageAnnotatorClient } from "@google-cloud/vision";
import type { OcrProvider } from "@/lib/ocr-service";
import { parseGoogleVisionCredentials } from "@/lib/google-vision-config";
import { getStorageService } from "@/lib/storage";
import { MockOcrProvider } from "@/lib/ocr-providers/MockOcrProvider";

const SUPPORTED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function buildFallbackText(reason: string, fallbackText: string) {
  return [
    "Aviso OCR: Google Vision no pudo procesar el ticket.",
    `Motivo: ${reason}`,
    "Se usaron datos mock para mantener el flujo de revisión. Revisa manualmente todos los campos antes de guardar.",
    "",
    fallbackText,
  ].join("\n");
}

export class GoogleVisionOcrProvider implements OcrProvider {
  private readonly fallbackProvider = new MockOcrProvider();
  private client: ImageAnnotatorClient | null = null;

  private getClient() {
    if (!this.client) {
      const credentials = parseGoogleVisionCredentials();
      this.client = new ImageAnnotatorClient({
        credentials,
        projectId: credentials.project_id,
      });
    }

    return this.client;
  }

  async extractText(fileUrl: string): Promise<string> {
    const fallbackText = await this.fallbackProvider.extractText(fileUrl);

    try {
      const storedObject = await getStorageService().getPrivateObject(fileUrl);

      if (!SUPPORTED_IMAGE_MIME_TYPES.has(storedObject.mimeType)) {
        return buildFallbackText(
          `Formato ${storedObject.mimeType} no soportado por Google Vision en este MVP.`,
          fallbackText
        );
      }

      const [result] = await this.getClient().documentTextDetection({
        image: { content: storedObject.buffer },
        imageContext: { languageHints: ["es", "en"] },
      });
      const extractedText = result.fullTextAnnotation?.text?.trim() || result.textAnnotations?.[0]?.description?.trim();

      if (!extractedText) {
        return buildFallbackText("Google Vision no devolvió texto legible.", fallbackText);
      }

      return extractedText;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Error desconocido ejecutando Google Vision.";
      return buildFallbackText(reason, fallbackText);
    }
  }
}
