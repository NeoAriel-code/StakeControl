import test from "node:test";
import assert from "node:assert/strict";
import { canUseFeatureForPlan } from "../src/lib/plan-rules";

test("free plan can use basic MVP features", () => {
  assert.equal(canUseFeatureForPlan("FREE", "manual_bet_registration"), true);
  assert.equal(canUseFeatureForPlan("FREE", "csv_export_basic"), true);
  assert.equal(canUseFeatureForPlan("FREE", "alerts_basic"), true);
});

test("free plan cannot use premium gated features", () => {
  assert.equal(canUseFeatureForPlan("FREE", "ai_responsible_analysis"), false);
  assert.equal(canUseFeatureForPlan("FREE", "monthly_report"), false);
  assert.equal(canUseFeatureForPlan("FREE", "export_advanced"), false);
});

test("premium plan can use premium gated features", () => {
  assert.equal(canUseFeatureForPlan("PREMIUM", "ai_responsible_analysis"), true);
  assert.equal(canUseFeatureForPlan("PREMIUM", "monthly_report"), true);
  assert.equal(canUseFeatureForPlan("PREMIUM", "export_advanced"), true);
});
