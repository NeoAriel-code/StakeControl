import "server-only";

import { PlanType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { canUseFeatureForPlan } from "@/lib/plan-rules";

export type UserPlan = "FREE" | "PREMIUM";

export type PlanFeature =
  | "manual_bet_registration"
  | "ocr_tickets"
  | "history_full"
  | "alerts_basic"
  | "alerts_intelligent"
  | "csv_export_basic"
  | "export_advanced"
  | "advanced_segmentation"
  | "monthly_report"
  | "ai_responsible_analysis";

export type FeatureAccess = {
  allowed: boolean;
  plan: UserPlan;
  limit?: number | null;
  used?: number;
  remaining?: number | null;
  upgradeMessage?: string;
};

const FREE_OCR_TICKETS_PER_MONTH = 10;
const PREMIUM_OCR_TICKETS_PER_MONTH = 250;

function getMonthStart(referenceDate = new Date()) {
  return new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
}

export async function getUserPlan(userId: string): Promise<UserPlan> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "active",
    },
    orderBy: { createdAt: "desc" },
  });

  if (
    subscription?.planType === PlanType.PREMIUM_MONTHLY ||
    subscription?.planType === PlanType.PREMIUM_ANNUAL
  ) {
    return "PREMIUM";
  }

  return "FREE";
}

export async function getMonthlyOcrTicketUsage(userId: string, referenceDate = new Date()) {
  const monthStart = getMonthStart(referenceDate);

  return prisma.betTicketImage.count({
    where: {
      userId,
      uploadedAt: {
        gte: monthStart,
        lte: referenceDate,
      },
    },
  });
}

export async function getFeatureAccess(userId: string, feature: PlanFeature): Promise<FeatureAccess> {
  const plan = await getUserPlan(userId);

  switch (feature) {
    case "manual_bet_registration":
    case "alerts_basic":
    case "csv_export_basic":
      return { allowed: true, plan };
    case "history_full":
    case "alerts_intelligent":
    case "export_advanced":
    case "advanced_segmentation":
    case "monthly_report":
    case "ai_responsible_analysis":
      return {
        allowed: canUseFeatureForPlan(plan, feature),
        plan,
        upgradeMessage: "Disponible en StakeControl Premium.",
      };
    case "ocr_tickets": {
      const used = await getMonthlyOcrTicketUsage(userId);
      const limit = plan === "PREMIUM" ? PREMIUM_OCR_TICKETS_PER_MONTH : FREE_OCR_TICKETS_PER_MONTH;
      const remaining = Math.max(limit - used, 0);

      return {
        allowed: remaining > 0,
        plan,
        limit,
        used,
        remaining,
        upgradeMessage:
          plan === "FREE"
            ? "Tu plan Free incluye hasta 10 tickets OCR por mes. Actualiza para ampliar el cupo."
            : undefined,
      };
    }
    default:
      return { allowed: false, plan };
  }
}

export async function canUseFeature(userId: string, feature: PlanFeature) {
  const access = await getFeatureAccess(userId, feature);
  return access.allowed;
}

export function getPlanLabel(plan: UserPlan) {
  return plan === "PREMIUM" ? "Plan Premium" : "Plan Free";
}

export function getHistoryCutoffDate(referenceDate = new Date()) {
  const cutoff = new Date(referenceDate);
  cutoff.setDate(cutoff.getDate() - 90);
  return cutoff;
}
