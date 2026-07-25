export const ANALYTICS_CONSENT_STORAGE_KEY = "stakecontrol.analytics-consent";

export type AnalyticsConsent = "granted" | "denied" | null;

function getStorage() {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getAnalyticsConsent(): AnalyticsConsent {
  const value = getStorage()?.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
  return value === "granted" || value === "denied" ? value : null;
}

export function setAnalyticsConsent(consent: Exclude<AnalyticsConsent, null>) {
  getStorage()?.setItem(ANALYTICS_CONSENT_STORAGE_KEY, consent);
}

export function clearAnalyticsConsent() {
  getStorage()?.removeItem(ANALYTICS_CONSENT_STORAGE_KEY);
}
