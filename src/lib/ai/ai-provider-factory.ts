import type { AiProvider } from "@/lib/ai/ai-provider";
import { assertAiProviderAllowed, resolveAiProviderName } from "@/lib/ai/ai-provider-config";
import { MockAiProvider } from "@/lib/ai/mock-ai-provider";
import { OpenAiProvider } from "@/lib/ai/openai-provider";
import { DeepSeekProvider } from "@/lib/ai/deepseek-provider";

export function createAiProvider(providerName: "mock" | "openai" | "deepseek", environment: NodeJS.ProcessEnv = process.env): AiProvider {
  if (providerName === "openai") return new OpenAiProvider(environment.OPENAI_API_KEY);
  if (providerName === "deepseek") return new DeepSeekProvider(environment.DEEPSEEK_API_KEY, environment);
  return new MockAiProvider();
}

export function createConfiguredAiProvider(environment: NodeJS.ProcessEnv = process.env): AiProvider {
  const providerName = assertAiProviderAllowed(
    resolveAiProviderName(environment.AI_PROVIDER),
    environment.NODE_ENV
  );

  return createAiProvider(providerName, environment);
}

export function createConfiguredBehaviorAiProvider(environment: NodeJS.ProcessEnv = process.env): AiProvider {
  const configured = assertAiProviderAllowed(resolveAiProviderName(environment.AI_PROVIDER), environment.NODE_ENV);
  return configured === "mock" ? new MockAiProvider() : new OpenAiProvider(environment.OPENAI_API_KEY);
}
