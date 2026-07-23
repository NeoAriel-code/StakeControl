import assert from "node:assert/strict";
import test from "node:test";
import { BETA_TERMS_VERSION, hasAcceptedCurrentBetaTerms } from "../src/lib/beta-terms";

test("only the current beta terms version with an acceptance timestamp grants access", () => {
  assert.equal(BETA_TERMS_VERSION, "beta-2026-07-23");
  assert.equal(hasAcceptedCurrentBetaTerms({ betaTermsAcceptedAt: new Date("2026-07-23T12:00:00.000Z"), betaTermsVersion: BETA_TERMS_VERSION }), true);
  assert.equal(hasAcceptedCurrentBetaTerms({ betaTermsAcceptedAt: null, betaTermsVersion: BETA_TERMS_VERSION }), false);
  assert.equal(hasAcceptedCurrentBetaTerms({ betaTermsAcceptedAt: new Date("2026-07-23T12:00:00.000Z"), betaTermsVersion: "beta-old" }), false);
});
