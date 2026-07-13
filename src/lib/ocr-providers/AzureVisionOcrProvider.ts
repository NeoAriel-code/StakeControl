import type { OcrProvider } from "@/lib/ocr-service";

export class AzureVisionOcrProvider implements OcrProvider {
  async extractText(fileUrl: string): Promise<string> {
    void fileUrl;
    throw new Error(
      "AzureVisionOcrProvider está preparado como placeholder. Configura OCR_PROVIDER=mock o implementa la integración real con AZURE_VISION_ENDPOINT y AZURE_VISION_KEY."
    );
  }
}
