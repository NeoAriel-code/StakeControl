import type { OcrProvider } from "@/lib/ocr-service";

export class GoogleVisionOcrProvider implements OcrProvider {
  async extractText(fileUrl: string): Promise<string> {
    void fileUrl;
    throw new Error(
      "GoogleVisionOcrProvider está preparado como placeholder. Configura OCR_PROVIDER=mock o implementa la integración real con GOOGLE_VISION_API_KEY."
    );
  }
}
