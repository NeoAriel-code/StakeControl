export function parsePlanTesterEmails(value = "") {
  return new Set(
    value
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function canUsePlanTestControls(email: string, allowedEmails = process.env.PLAN_TESTER_EMAILS) {
  return parsePlanTesterEmails(allowedEmails).has(email.trim().toLowerCase());
}
