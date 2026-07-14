export const BET_TYPES = ["SINGLE", "COMBO", "SYSTEM", "LIVE", "PREMATCH", "UNKNOWN"] as const;
export type BetTypeValue = (typeof BET_TYPES)[number];

export const BET_RESULTS = ["PENDING", "WON", "LOST", "VOID", "CASHOUT", "UNKNOWN"] as const;
export type BetResultValue = (typeof BET_RESULTS)[number];
