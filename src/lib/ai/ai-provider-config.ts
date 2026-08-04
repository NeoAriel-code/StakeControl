export type AiProviderName = "mock" | "openai" | "deepseek";

export function resolveAiProviderName(value?: string): AiProviderName {
  switch (value?.trim().toLowerCase()) {
    case "mock":
    case "openai":
    case "deepseek":
      return value.trim().toLowerCase() as AiProviderName;
    default:
      throw new Error("AI_PROVIDER must be configured with a supported provider.");
  }
}

export function assertAiProviderAllowed(
  name: AiProviderName,
  nodeEnv = process.env.NODE_ENV
): AiProviderName {
  if (name === "deepseek") {
    throw new Error("AI_PROVIDER cannot use DeepSeek during the closed beta.");
  }

  if (nodeEnv === "production" && name === "mock") {
    throw new Error("AI_PROVIDER must use a production provider.");
  }

  return name;
}
