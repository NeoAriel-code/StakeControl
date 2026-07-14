export const BET_TYPES = ["SINGLE", "COMBO", "BET_BUILDER", "SYSTEM"] as const;
export type BetTypeValue = (typeof BET_TYPES)[number];

export const BET_TYPE_LABELS: Record<string, string> = {
  SINGLE: "Simple",
  COMBO: "Múltiple",
  BET_BUILDER: "Bet Builder",
  SYSTEM: "Sistema",
  LIVE: "Simple",
  PREMATCH: "Simple",
  UNKNOWN: "Sin clasificar",
};

export const BET_RESULTS = ["PENDING", "WON", "LOST", "VOID", "CASHOUT", "UNKNOWN"] as const;
export type BetResultValue = (typeof BET_RESULTS)[number];

export const BET_RESULT_OPTIONS = ["PENDING", "WON", "LOST", "VOID", "CASHOUT"] as const;
export type BetResultOption = (typeof BET_RESULT_OPTIONS)[number];

export const BET_RESULT_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  WON: "Ganada",
  LOST: "Perdida",
  VOID: "Anulada",
  CASHOUT: "Cashout",
  UNKNOWN: "Sin definir",
};
