import type { AiProvider } from "@/lib/ai/ai-provider";
import { assertAiProviderAllowed, resolveAiProviderName } from "@/lib/ai/ai-provider-config";
import { MockAiProvider } from "@/lib/ai/mock-ai-provider";
import { OpenAiProvider } from "@/lib/ai/openai-provider";

export function createConfiguredAiProvider(environment: NodeJS.ProcessEnv = process.env): AiProvider {
  const providerName = assertAiProviderAllowed(
    resolveAiProviderName(environment.AI_PROVIDER),
    environment.NODE_ENV
  );

  return providerName === "openai" ? new OpenAiProvider() : new MockAiProvider();
}
