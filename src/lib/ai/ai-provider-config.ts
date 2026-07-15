export type AiProviderName = "mock" | "openai";

export function resolveAiProviderName(value?: string): AiProviderName {
  switch (value?.trim().toLowerCase()) {
    case "mock":
    case "openai":
      return value.trim().toLowerCase() as AiProviderName;
    default:
      throw new Error("AI_PROVIDER must be configured with a supported provider.");
  }
}

export function assertAiProviderAllowed(
  name: AiProviderName,
  nodeEnv = process.env.NODE_ENV
): AiProviderName {
  if (nodeEnv === "production" && name === "mock") {
    throw new Error("AI_PROVIDER=openai must be configured in production.");
  }

  return name;
}
