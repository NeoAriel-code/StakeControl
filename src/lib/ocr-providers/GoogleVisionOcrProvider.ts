import { ImageAnnotatorClient } from "@google-cloud/vision";
import type { OcrProvider } from "@/lib/ocr-service";
import { OcrProcessingError } from "../ocr-errors";
import { parseGoogleVisionCredentials } from "@/lib/google-vision-config";

const SUPPORTED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type StoredObject = { buffer: Buffer; mimeType: string; fileName: string };
type VisionClient = Pick<ImageAnnotatorClient, "documentTextDetection">;

type GoogleVisionOcrProviderDependencies = {
  getStoredObject?: (fileUrl: string) => Promise<StoredObject>;
  client?: VisionClient;
};

export class GoogleVisionOcrProvider implements OcrProvider {
  private client: VisionClient | null;

  constructor(private readonly dependencies: GoogleVisionOcrProviderDependencies = {}) {
    this.client = dependencies.client ?? null;
  }

  private getClient(): VisionClient {
    if (!this.client) {
      const credentials = parseGoogleVisionCredentials();
      this.client = new ImageAnnotatorClient({
        credentials,
        projectId: credentials.project_id,
      });
    }

    return this.client;
  }

  private async getStoredObject(fileUrl: string): Promise<StoredObject> {
    if (this.dependencies.getStoredObject) {
      return this.dependencies.getStoredObject(fileUrl);
    }

    const { getStorageService } = await import("@/lib/storage");
    return getStorageService().getPrivateObject(fileUrl);
  }

  async extractText(fileUrl: string): Promise<string> {
    try {
      const storedObject = await this.getStoredObject(fileUrl);

      if (!SUPPORTED_IMAGE_MIME_TYPES.has(storedObject.mimeType)) {
        throw new OcrProcessingError();
      }

      const [result] = await this.getClient().documentTextDetection({
        image: { content: storedObject.buffer },
        imageContext: { languageHints: ["es", "en"] },
      });
      const extractedText = result.fullTextAnnotation?.text?.trim() || result.textAnnotations?.[0]?.description?.trim();

      if (!extractedText) {
        throw new OcrProcessingError();
      }

      return extractedText;
    } catch {
      throw new OcrProcessingError();
    }
  }
}
