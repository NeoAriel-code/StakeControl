export const BETA_TERMS_VERSION = "beta-2026-08-04-admin-access";

type BetaTermsState = {
  betaTermsAcceptedAt: Date | null;
  betaTermsVersion: string | null;
};

export function hasAcceptedCurrentBetaTerms(user: BetaTermsState) {
  return Boolean(user.betaTermsAcceptedAt && user.betaTermsVersion === BETA_TERMS_VERSION);
}
