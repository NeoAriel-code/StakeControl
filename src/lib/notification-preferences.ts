import { AlertType, type NotificationPreferences } from "@prisma/client";

export const ALERT_EMAIL_PREFERENCES = [
  { type: AlertType.LIMIT_APPROACHING, field: "limitApproachingEnabled", label: "Límite cerca de alcanzarse" },
  { type: AlertType.LIMIT_EXCEEDED, field: "limitExceededEnabled", label: "Límite superado" },
  { type: AlertType.STAKE_INCREASE, field: "stakeIncreaseEnabled", label: "Aumento reciente del stake" },
  { type: AlertType.LOSS_STREAK, field: "lossStreakEnabled", label: "Racha de pérdidas" },
  { type: AlertType.HIGH_FREQUENCY, field: "highFrequencyEnabled", label: "Frecuencia alta de registros" },
  { type: AlertType.PAUSE_RECOMMENDED, field: "pauseRecommendedEnabled", label: "Pausa sugerida" },
] as const;

export function buildNotificationPreferences(enabled: boolean) {
  return {
    emailAlertsEnabled: enabled,
    limitApproachingEnabled: enabled,
    limitExceededEnabled: enabled,
    stakeIncreaseEnabled: enabled,
    lossStreakEnabled: enabled,
    highFrequencyEnabled: enabled,
    pauseRecommendedEnabled: enabled,
  };
}

export function isAlertEmailEnabled(preferences: NotificationPreferences | null, type: AlertType) {
  if (!preferences?.emailAlertsEnabled) return false;
  const item = ALERT_EMAIL_PREFERENCES.find((candidate) => candidate.type === type);
  return item ? preferences[item.field] : false;
}
