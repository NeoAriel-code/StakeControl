const MAX_TICKET_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

type StoredObject = {
  reference: string;
  byteLength: number;
  mimeType: string;
};

type TicketStorage = {
  savePrivateObject(input: {
    userId: string;
    namespace: string;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<StoredObject>;
  deletePrivateObject(reference: string): Promise<void>;
};

type TicketOcrService = {
  extractText(reference: string): Promise<string>;
};

function getFileExtension(fileName: string) {
  const index = fileName.lastIndexOf(".");
  return index >= 0 ? fileName.slice(index).toLowerCase() : "";
}

export function validateTicketFile(file: File) {
  if (!file || file.size === 0) {
    throw new Error("Selecciona un archivo JPG, PNG o WEBP antes de continuar.");
  }

  if (file.size > MAX_TICKET_UPLOAD_BYTES) {
    throw new Error("El archivo supera el tamaño máximo permitido de 10 MB.");
  }

  const extension = getFileExtension(file.name);
  if (!ALLOWED_MIME_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error("Formato no permitido. Solo se aceptan archivos JPG, PNG o WEBP.");
  }
}

export function validateFileSignature(buffer: Buffer, mimeType: string) {
  const signatures: Record<string, (buffer: Buffer) => boolean> = {
    "image/jpeg": (value) => value[0] === 0xff && value[1] === 0xd8 && value[2] === 0xff,
    "image/png": (value) => value.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    "image/webp": (value) =>
      value.subarray(0, 4).toString("ascii") === "RIFF" && value.subarray(8, 12).toString("ascii") === "WEBP",
  };

  if (!signatures[mimeType]?.(buffer)) {
    throw new Error("El contenido del archivo no coincide con el formato declarado.");
  }
}

export async function saveTicketAndExtractText({
  storage,
  ocrService,
  input,
}: {
  storage: TicketStorage;
  ocrService: TicketOcrService;
  input: {
    userId: string;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
  };
}) {
  let storedReference: string | undefined;

  try {
    const storedObject = await storage.savePrivateObject({
      userId: input.userId,
      namespace: "tickets",
      fileName: input.fileName,
      mimeType: input.mimeType,
      buffer: input.buffer,
    });
    storedReference = storedObject.reference;

    return {
      storedObject,
      rawText: await ocrService.extractText(storedReference),
    };
  } catch (error) {
    if (storedReference) {
      await storage.deletePrivateObject(storedReference).catch(() => undefined);
    }
    throw error;
  }
}
