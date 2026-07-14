import "server-only";

import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { resolveStorageProviderName } from "@/lib/storage-config";

const LOCAL_STORAGE_ROOT = path.join("/tmp", "stakecontrol-storage");
const LOCAL_REFERENCE_PREFIX = "local://";
const SUPABASE_REFERENCE_PREFIX = "supabase://";
const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "tickets";

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
  deletePrivateObject(reference: string): Promise<void>;
}

export function sanitizeUploadedFileName(fileName: string) {
  const baseName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "-");
  return baseName.slice(0, 120) || "ticket";
}

function getFileExtension(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  return extension || "";
}

class LocalStorageService implements StorageService {
  async savePrivateObject(input: SavePrivateObjectInput): Promise<StoredObject> {
    const sanitizedFileName = sanitizeUploadedFileName(input.fileName);
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
    if (path.isAbsolute(relativePath) || relativePath.includes("..")) {
      throw new Error("Invalid storage reference.");
    }

    const absolutePath = path.join(LOCAL_STORAGE_ROOT, relativePath);
    const buffer = await readFile(absolutePath);

    return {
      buffer,
      mimeType: inferMimeTypeFromExtension(path.extname(relativePath).toLowerCase()),
      fileName: path.basename(relativePath),
    };
  }

  async deletePrivateObject(reference: string): Promise<void> {
    if (!reference.startsWith(LOCAL_REFERENCE_PREFIX)) {
      return;
    }

    const relativePath = reference.slice(LOCAL_REFERENCE_PREFIX.length);
    if (path.isAbsolute(relativePath) || relativePath.includes("..")) {
      throw new Error("Invalid storage reference.");
    }

    const absolutePath = path.join(LOCAL_STORAGE_ROOT, relativePath);

    try {
      await unlink(absolutePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
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

function parseSupabaseReference(reference: string) {
  const prefix = `${SUPABASE_REFERENCE_PREFIX}${SUPABASE_BUCKET}/`;

  if (!reference.startsWith(prefix)) {
    throw new Error("Invalid Supabase storage reference.");
  }

  const objectPath = reference.slice(prefix.length);
  if (!objectPath || objectPath.includes("..") || path.isAbsolute(objectPath)) {
    throw new Error("Invalid Supabase storage object path.");
  }

  return objectPath;
}

class SupabaseStorageService implements StorageService {
  private readonly client: SupabaseClient;

  constructor(url: string, secretKey: string) {
    this.client = createClient(url, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async savePrivateObject(input: SavePrivateObjectInput): Promise<StoredObject> {
    const sanitizedFileName = sanitizeUploadedFileName(input.fileName);
    const extension = getFileExtension(sanitizedFileName);
    const objectPath = path.posix.join(input.namespace, input.userId, `${randomUUID()}${extension}`);
    const { error } = await this.client.storage.from(SUPABASE_BUCKET).upload(objectPath, input.buffer, {
      contentType: input.mimeType,
      upsert: false,
    });

    if (error) {
      throw new Error(`No se pudo guardar el ticket privado: ${error.message}`);
    }

    return {
      reference: `${SUPABASE_REFERENCE_PREFIX}${SUPABASE_BUCKET}/${objectPath}`,
      byteLength: input.buffer.byteLength,
      mimeType: input.mimeType,
    };
  }

  async getPrivateObject(reference: string): Promise<RetrievedObject> {
    const objectPath = parseSupabaseReference(reference);
    const { data, error } = await this.client.storage.from(SUPABASE_BUCKET).download(objectPath);

    if (error || !data) {
      throw new Error(`No se pudo recuperar el ticket privado: ${error?.message ?? "Archivo no encontrado."}`);
    }

    return {
      buffer: Buffer.from(await data.arrayBuffer()),
      mimeType: data.type || inferMimeTypeFromExtension(path.extname(objectPath).toLowerCase()),
      fileName: path.basename(objectPath),
    };
  }

  async deletePrivateObject(reference: string): Promise<void> {
    const objectPath = parseSupabaseReference(reference);
    const { error } = await this.client.storage.from(SUPABASE_BUCKET).remove([objectPath]);

    if (error) {
      throw new Error(`No se pudo eliminar el ticket privado: ${error.message}`);
    }
  }
}

function createStorageService(): StorageService {
  const providerName = resolveStorageProviderName();

  if (providerName === "supabase") {
    return new SupabaseStorageService(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  }

  return new LocalStorageService();
}

const storageService = createStorageService();

export function getStorageService() {
  return storageService;
}

export function isPrivateStorageReference(reference: string) {
  return reference.startsWith(LOCAL_REFERENCE_PREFIX) || reference.startsWith(SUPABASE_REFERENCE_PREFIX);
}
