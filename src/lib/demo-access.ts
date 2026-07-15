export function parseDemoDataEmails(value = "") {
  return new Set(
    value
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function canUseDemoData(email: string, allowedEmails = process.env.DEMO_DATA_EMAILS) {
  return parseDemoDataEmails(allowedEmails).has(email.trim().toLowerCase());
}
