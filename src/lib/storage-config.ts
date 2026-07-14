export type StorageProviderName = "local" | "supabase";

export function resolveStorageProviderName(
  supabaseUrl = process.env.SUPABASE_URL,
  supabaseSecretKey = process.env.SUPABASE_SECRET_KEY
): StorageProviderName {
  return supabaseUrl && supabaseSecretKey ? "supabase" : "local";
}
