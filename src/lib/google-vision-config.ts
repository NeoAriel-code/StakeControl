type GoogleVisionCredentials = {
  client_email: string;
  private_key: string;
  project_id?: string;
};

export function parseGoogleVisionCredentials(value = process.env.GOOGLE_VISION_CREDENTIALS_JSON) {
  if (!value) {
    throw new Error("GOOGLE_VISION_CREDENTIALS_JSON no está configurada.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("GOOGLE_VISION_CREDENTIALS_JSON debe contener un JSON válido.");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof (parsed as GoogleVisionCredentials).client_email !== "string" ||
    typeof (parsed as GoogleVisionCredentials).private_key !== "string"
  ) {
    throw new Error("La credencial de Google Vision no contiene client_email y private_key.");
  }

  return parsed as GoogleVisionCredentials;
}
