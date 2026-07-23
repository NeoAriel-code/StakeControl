import { createHash } from "node:crypto";

export function anonymizeUserId(userId: string) {
  return createHash("sha256").update(`stakecontrol:sentry:${userId}`).digest("hex");
}
