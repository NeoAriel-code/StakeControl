import { assertProductionEmailConfiguration } from "@/lib/email/email-config";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    assertProductionEmailConfiguration();
  }
}
