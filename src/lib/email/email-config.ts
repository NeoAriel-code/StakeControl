type EmailEnvironment = Record<string, string | undefined>;

export type EmailConfiguration = {
  provider: "resend";
  apiKey: string;
  from: string;
  replyTo?: string;
};

export function getEmailConfiguration(environment: EmailEnvironment = process.env): EmailConfiguration | null {
  const provider = environment.EMAIL_PROVIDER?.trim().toLowerCase();
  const apiKey = environment.RESEND_API_KEY?.trim();
  const from = environment.EMAIL_FROM?.trim();
  const replyTo = environment.EMAIL_REPLY_TO?.trim();

  if (provider !== "resend" || !apiKey || !from) {
    return null;
  }

  return { provider: "resend", apiKey, from, ...(replyTo ? { replyTo } : {}) };
}
