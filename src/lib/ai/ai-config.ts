type AiEnvironment = Record<string, string | undefined>;

const DEFAULT_TICKET_PRIMARY_MODEL = "gpt-4.1-mini";
const DEFAULT_TICKET_FALLBACK_MODEL = "gpt-4.1-mini";
const DEFAULT_REPORT_PRIMARY_MODEL = "gpt-5-mini";
const DEFAULT_REPORT_FALLBACK_MODEL = "gpt-4.1-mini";

function readModel(environment: AiEnvironment, key: string, fallback: string) {
  return environment[key]?.trim() || fallback;
}

export type TicketProviderName = "mock" | "openai" | "deepseek";

function readTicketProvider(environment: AiEnvironment, key: string, fallback: TicketProviderName): TicketProviderName {
  const value = environment[key]?.trim().toLowerCase() || fallback;
  if (value === "mock" || value === "openai" || value === "deepseek") return value;
  throw new Error(`${key} must be mock, openai or deepseek.`);
}

export function getAiTicketProviderConfig(environment: AiEnvironment = process.env): {
  primary: TicketProviderName;
  fallback: Exclude<TicketProviderName, "deepseek">;
  deepSeekModel: string;
  openAiFallbackModel: string;
} {
  const legacyProvider = environment.AI_PROVIDER?.trim().toLowerCase();
  const fallbackDefault = legacyProvider === "mock" || legacyProvider === "openai"
    ? legacyProvider
    : "openai";
  const fallback = readTicketProvider(environment, "AI_TICKET_FALLBACK_PROVIDER", fallbackDefault);
  if (fallback === "deepseek") throw new Error("AI_TICKET_FALLBACK_PROVIDER must be openai or mock.");
  const primary = readTicketProvider(environment, "AI_TICKET_PRIMARY_PROVIDER", "openai");
  if (primary === "deepseek") throw new Error("AI_TICKET_PRIMARY_PROVIDER cannot use DeepSeek during the closed beta.");
  return {
    primary,
    fallback,
    deepSeekModel: "deepseek-v4-flash",
    openAiFallbackModel: readModel(environment, "AI_TICKET_FALLBACK_MODEL", DEFAULT_TICKET_FALLBACK_MODEL),
  };
}

export function getOpenAiFallbackLimit(environment: AiEnvironment = process.env) {
  const value = Number(environment.AI_TICKET_OPENAI_FALLBACK_LIMIT_PER_MINUTE);
  return Number.isInteger(value) && value >= 0 ? value : 300;
}

export function assertProductionAiConfiguration(environment: AiEnvironment = process.env) {
  if (environment.NODE_ENV !== "production") return;
  const route = getAiTicketProviderConfig(environment);
  if ((route.primary === "openai" || route.fallback === "openai") && !environment.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for the enabled ticket route.");
  }
}

export function getAiModelConfig(environment: AiEnvironment = process.env) {
  return {
    ticketPrimary: readModel(environment, "AI_TICKET_PRIMARY_MODEL", DEFAULT_TICKET_PRIMARY_MODEL),
    ticketFallback: readModel(environment, "AI_TICKET_FALLBACK_MODEL", DEFAULT_TICKET_FALLBACK_MODEL),
    reportPrimary: readModel(environment, "AI_REPORT_PRIMARY_MODEL", DEFAULT_REPORT_PRIMARY_MODEL),
    reportFallback: readModel(environment, "AI_REPORT_FALLBACK_MODEL", DEFAULT_REPORT_FALLBACK_MODEL),
  };
}
