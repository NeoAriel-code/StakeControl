export type StorageProviderName = "local" | "supabase";

export function resolveStorageProviderName(
  url = process.env.SUPABASE_URL,
  key = process.env.SUPABASE_SECRET_KEY
): StorageProviderName {
  const hasUrl = Boolean(url?.trim());
  const hasKey = Boolean(key?.trim());

  if (hasUrl && hasKey) {
    return "supabase";
  }

  if (!hasUrl && !hasKey) {
    return "local";
  }

  if (hasUrl) {
    throw new Error("SUPABASE_SECRET_KEY must be configured when SUPABASE_URL is set.");
  }

  if (hasKey) {
    throw new Error("SUPABASE_URL must be configured when SUPABASE_SECRET_KEY is set.");
  }

  throw new Error("Storage provider credentials must be configured.");
}

export function assertStorageProviderAllowed(
  name: StorageProviderName,
  nodeEnv = process.env.NODE_ENV
): StorageProviderName {
  if (nodeEnv === "production" && name === "local") {
    throw new Error("A non-local storage provider must be configured in production.");
  }

  return name;
}
