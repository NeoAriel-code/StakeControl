export type OcrProviderName = "mock" | "tesseract" | "google_vision" | "aws_textract" | "azure_vision";

export function resolveOcrProviderName(value?: string): OcrProviderName {
  switch (value?.trim().toLowerCase()) {
    case "tesseract":
    case "google_vision":
    case "aws_textract":
    case "azure_vision":
    case "mock":
      return value.trim().toLowerCase() as OcrProviderName;
    default:
      throw new Error("OCR_PROVIDER must be configured with a supported provider.");
  }
}

export function assertOcrProviderAllowed(
  name: OcrProviderName,
  nodeEnv = process.env.NODE_ENV
): OcrProviderName {
  if (nodeEnv === "production" && (name === "mock" || name === "tesseract")) {
    throw new Error("OCR_PROVIDER must use a cloud provider in production.");
  }

  return name;
}
