export type OcrProviderName = "mock" | "tesseract" | "google_vision" | "aws_textract" | "azure_vision";

export function resolveOcrProviderName(provider: string | undefined): OcrProviderName {
  switch (provider?.trim().toLowerCase()) {
    case "tesseract":
    case "google_vision":
    case "aws_textract":
    case "azure_vision":
    case "mock":
      return provider.trim().toLowerCase() as OcrProviderName;
    default:
      return "mock";
  }
}
