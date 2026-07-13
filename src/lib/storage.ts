import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const LOCAL_STORAGE_ROOT = path.join("/tmp", "stakecontrol-storage");
const LOCAL_REFERENCE_PREFIX = "local://";

type SavePrivateObjectInput = {
  userId: string;
  namespace: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
};

type StoredObject = {
  reference: string;
  byteLength: number;
  mimeType: string;
};

type RetrievedObject = {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
};

export interface StorageService {
  savePrivateObject(input: SavePrivateObjectInput): Promise<StoredObject>;
  getPrivateObject(reference: string): Promise<RetrievedObject>;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function getFileExtension(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  return extension || "";
}

class LocalStorageService implements StorageService {
  async savePrivateObject(input: SavePrivateObjectInput): Promise<StoredObject> {
    const sanitizedFileName = sanitizeFileName(input.fileName);
    const extension = getFileExtension(sanitizedFileName);
    const objectName = `${randomUUID()}${extension}`;
    const relativeDirectory = path.join(input.namespace, input.userId);
    const relativePath = path.join(relativeDirectory, objectName);
    const absoluteDirectory = path.join(LOCAL_STORAGE_ROOT, relativeDirectory);
    const absolutePath = path.join(LOCAL_STORAGE_ROOT, relativePath);

    await mkdir(absoluteDirectory, { recursive: true });
    await writeFile(absolutePath, input.buffer);

    return {
      reference: `${LOCAL_REFERENCE_PREFIX}${relativePath}`,
      byteLength: input.buffer.byteLength,
      mimeType: input.mimeType,
    };
  }

  async getPrivateObject(reference: string): Promise<RetrievedObject> {
    if (!reference.startsWith(LOCAL_REFERENCE_PREFIX)) {
      throw new Error("Unsupported storage reference.");
    }

    const relativePath = reference.slice(LOCAL_REFERENCE_PREFIX.length);
    const absolutePath = path.join(LOCAL_STORAGE_ROOT, relativePath);
    const buffer = await readFile(absolutePath);

    return {
      buffer,
      mimeType: inferMimeTypeFromExtension(path.extname(relativePath).toLowerCase()),
      fileName: path.basename(relativePath),
    };
  }
}

function inferMimeTypeFromExtension(extension: string) {
  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}

const storageService: StorageService = new LocalStorageService();

export function getStorageService() {
  return storageService;
}

export function isPrivateStorageReference(reference: string) {
  return reference.startsWith(LOCAL_REFERENCE_PREFIX);
}
