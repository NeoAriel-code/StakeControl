type EmailEnvironment = Record<string, string | undefined>;

export type EmailConfiguration = {
  provider: "resend";
  apiKey: string;
  from: string;
  securityFrom: string;
  alertsFrom: string;
  reportsFrom: string;
  replyTo?: string;
};

function getValue(environment: EmailEnvironment, key: string) {
  return environment[key]?.trim();
}

function hasVercelHost(url: string) {
  try {
    return new URL(url).hostname.endsWith("vercel.app");
  } catch {
    return false;
  }
}

export function getEmailConfiguration(environment: EmailEnvironment = process.env): EmailConfiguration | null {
  const provider = getValue(environment, "EMAIL_PROVIDER")?.toLowerCase();
  const apiKey = getValue(environment, "RESEND_API_KEY");
  const from = getValue(environment, "EMAIL_DEFAULT_FROM") ?? getValue(environment, "EMAIL_FROM");
  const securityFrom = getValue(environment, "EMAIL_SECURITY_FROM") ?? from;
  const alertsFrom = getValue(environment, "EMAIL_ALERTS_FROM") ?? from;
  const reportsFrom = getValue(environment, "EMAIL_REPORTS_FROM") ?? from;
  const replyTo = getValue(environment, "EMAIL_REPLY_TO");

  if ((provider && provider !== "resend") || !apiKey || !from || !securityFrom || !alertsFrom || !reportsFrom) {
    return null;
  }

  return { provider: "resend", apiKey, from, securityFrom, alertsFrom, reportsFrom, ...(replyTo ? { replyTo } : {}) };
}

export function assertProductionEmailConfiguration(environment: EmailEnvironment = process.env) {
  if (environment.NODE_ENV !== "production") return;

  const required = [
    "NEXT_PUBLIC_APP_URL",
    "APP_URL",
    "RESEND_API_KEY",
    "EMAIL_DEFAULT_FROM",
    "EMAIL_SECURITY_FROM",
    "EMAIL_ALERTS_FROM",
    "EMAIL_REPORTS_FROM",
    "EMAIL_REPLY_TO",
    "RESEND_WEBHOOK_SECRET",
  ];
  const missing = required.filter((name) => !getValue(environment, name));
  if (missing.length > 0) {
    throw new Error(`Missing required production email configuration: ${missing.join(", ")}.`);
  }

  for (const name of ["NEXT_PUBLIC_APP_URL", "APP_URL"]) {
    const url = getValue(environment, name)!;
    if (hasVercelHost(url)) throw new Error(`${name} must not use a vercel.app host in production.`);
  }

  if (!getEmailConfiguration(environment)) {
    throw new Error("Resend transactional email configuration is invalid in production.");
  }
}
