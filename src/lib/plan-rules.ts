import type { PlanFeature, UserPlan } from "@/lib/plans";

const PREMIUM_FEATURES = new Set<PlanFeature>([
  "history_full",
  "alerts_intelligent",
  "export_advanced",
  "advanced_segmentation",
  "monthly_report",
  "ai_responsible_analysis",
]);

const ALWAYS_ALLOWED_FEATURES = new Set<PlanFeature>([
  "manual_bet_registration",
  "alerts_basic",
  "csv_export_basic",
]);

export function canUseFeatureForPlan(plan: UserPlan, feature: PlanFeature) {
  if (ALWAYS_ALLOWED_FEATURES.has(feature)) {
    return true;
  }

  if (PREMIUM_FEATURES.has(feature)) {
    return plan === "PREMIUM";
  }

  return false;
}
