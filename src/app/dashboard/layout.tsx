import { requireUser } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getPlanLabel, getUserPlan } from "@/lib/plans";
import prisma from "@/lib/prisma";
import { EmailSecurityAlert } from "@/components/account/EmailSecurityAlert";
import type { ReactNode } from "react";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const plan = await getUserPlan(user.id);
  const emailSecurityAlerts = await prisma.accountSecurityAlert.findMany({
    where: { userId: user.id },
    orderBy: { occurredAt: "desc" },
    take: 1,
    select: { id: true, kind: true, occurredAt: true },
  });

  return (
    <AppLayout
      pageTitle="Dashboard"
      userName={user.name || user.email}
      planLabel={getPlanLabel(plan)}
      plan={plan}
    >
      <EmailSecurityAlert alerts={emailSecurityAlerts} />
      {children}
    </AppLayout>
  );
}
