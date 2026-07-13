import "server-only";

import { AwsTextractOcrProvider } from "@/lib/ocr-providers/AwsTextractOcrProvider";
import { AzureVisionOcrProvider } from "@/lib/ocr-providers/AzureVisionOcrProvider";
import { GoogleVisionOcrProvider } from "@/lib/ocr-providers/GoogleVisionOcrProvider";
import { MockOcrProvider } from "@/lib/ocr-providers/MockOcrProvider";

export interface OcrProvider {
  extractText(fileUrl: string): Promise<string>;
}

export type OcrProviderName = "mock" | "google_vision" | "aws_textract" | "azure_vision";

function getConfiguredOcrProviderName(): OcrProviderName {
  const provider = process.env.OCR_PROVIDER?.trim().toLowerCase();

  switch (provider) {
    case "google_vision":
    case "aws_textract":
    case "azure_vision":
    case "mock":
      return provider;
    default:
      return "mock";
  }
}

export function createOcrProvider(): OcrProvider {
  const providerName = getConfiguredOcrProviderName();

  switch (providerName) {
    case "google_vision":
      return new GoogleVisionOcrProvider();
    case "aws_textract":
      return new AwsTextractOcrProvider();
    case "azure_vision":
      return new AzureVisionOcrProvider();
    case "mock":
    default:
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
