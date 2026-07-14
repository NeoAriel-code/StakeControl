type AiEnvironment = Record<string, string | undefined>;

const DEFAULT_TICKET_PRIMARY_MODEL = "gpt-5-mini";
const DEFAULT_TICKET_FALLBACK_MODEL = "gpt-4.1-mini";
const DEFAULT_REPORT_PRIMARY_MODEL = "gpt-5-mini";
const DEFAULT_REPORT_FALLBACK_MODEL = "gpt-4.1-mini";

function readModel(environment: AiEnvironment, key: string, fallback: string) {
  return environment[key]?.trim() || fallback;
}

export function getAiModelConfig(environment: AiEnvironment = process.env) {
  return {
    ticketPrimary: readModel(environment, "AI_TICKET_PRIMARY_MODEL", DEFAULT_TICKET_PRIMARY_MODEL),
    ticketFallback: readModel(environment, "AI_TICKET_FALLBACK_MODEL", DEFAULT_TICKET_FALLBACK_MODEL),
    reportPrimary: readModel(environment, "AI_REPORT_PRIMARY_MODEL", DEFAULT_REPORT_PRIMARY_MODEL),
    reportFallback: readModel(environment, "AI_REPORT_FALLBACK_MODEL", DEFAULT_REPORT_FALLBACK_MODEL),
  };
}
