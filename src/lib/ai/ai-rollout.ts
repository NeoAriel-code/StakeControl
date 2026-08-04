export function stableRolloutBucket(betTicketImageId: string) {
  let hash = 2166136261;
  for (let index = 0; index < betTicketImageId.length; index += 1) {
    hash ^= betTicketImageId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 100;
}

export function isInStableRollout(betTicketImageId: string, percentage: number) {
  const normalizedPercentage = Math.max(0, Math.min(100, Math.trunc(percentage)));
  return stableRolloutBucket(betTicketImageId) < normalizedPercentage;
}
