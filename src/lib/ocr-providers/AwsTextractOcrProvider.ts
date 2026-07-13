import type { OcrProvider } from "@/lib/ocr-service";

export class AwsTextractOcrProvider implements OcrProvider {
  async extractText(fileUrl: string): Promise<string> {
    void fileUrl;
    throw new Error(
      "AwsTextractOcrProvider está preparado como placeholder. Configura OCR_PROVIDER=mock o implementa la integración real con credenciales AWS."
    );
  }
}
