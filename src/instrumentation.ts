import { assertProductionEmailConfiguration } from "@/lib/email/email-config";

export async function register() {
  assertProductionEmailConfiguration();
}
