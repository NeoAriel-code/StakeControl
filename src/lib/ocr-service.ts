import "server-only";

import { AwsTextractOcrProvider } from "@/lib/ocr-providers/AwsTextractOcrProvider";
import { AzureVisionOcrProvider } from "@/lib/ocr-providers/AzureVisionOcrProvider";
import { GoogleVisionOcrProvider } from "@/lib/ocr-providers/GoogleVisionOcrProvider";
import { MockOcrProvider } from "@/lib/ocr-providers/MockOcrProvider";
import { TesseractOcrProvider } from "@/lib/ocr-providers/TesseractOcrProvider";
import {
  assertOcrProviderAllowed,
  resolveOcrProviderName,
  type OcrProviderName,
} from "@/lib/ocr-config";

export interface OcrProvider {
  extractText(fileUrl: string): Promise<string>;
}

export class OcrProcessingError extends Error {
  constructor() {
    super("No se pudo procesar el ticket. Inténtalo de nuevo o completa los datos manualmente.");
    this.name = "OcrProcessingError";
  }
}

export function getConfiguredOcrProviderName(): OcrProviderName {
  return assertOcrProviderAllowed(resolveOcrProviderName(process.env.OCR_PROVIDER));
}

export function createOcrProvider(): OcrProvider {
  const providerName = getConfiguredOcrProviderName();

  switch (providerName) {
    case "tesseract":
      return new TesseractOcrProvider();
    case "google_vision":
      return new GoogleVisionOcrProvider();
    case "aws_textract":
      return new AwsTextractOcrProvider();
    case "azure_vision":
      return new AzureVisionOcrProvider();
    case "mock":
      return new MockOcrProvider();
  }
}

export class OcrService {
  constructor(private readonly provider: OcrProvider) {}

  extractText(fileUrl: string) {
    return this.provider.extractText(fileUrl);
  }
}

export function createOcrService() {
  return new OcrService(createOcrProvider());
}
