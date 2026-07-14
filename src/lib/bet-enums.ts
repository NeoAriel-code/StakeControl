export const BET_TYPES = ["SINGLE", "COMBO", "SYSTEM", "LIVE", "PREMATCH", "UNKNOWN"] as const;
export type BetTypeValue = (typeof BET_TYPES)[number];

export const BET_TYPE_LABELS: Record<BetTypeValue, string> = {
  SINGLE: "Simple",
  COMBO: "Combinada",
  SYSTEM: "Sistema",
  LIVE: "En vivo",
  PREMATCH: "Prepartido",
  UNKNOWN: "Por definir",
};

export const BET_RESULTS = ["PENDING", "WON", "LOST", "VOID", "CASHOUT", "UNKNOWN"] as const;
export type BetResultValue = (typeof BET_RESULTS)[number];

export const BET_RESULT_LABELS: Record<BetResultValue, string> = {
  PENDING: "Pendiente",
  WON: "Ganada",
  LOST: "Perdida",
  VOID: "Anulada",
  CASHOUT: "Cashout",
  UNKNOWN: "Sin definir",
};
