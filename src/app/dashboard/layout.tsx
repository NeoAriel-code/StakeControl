import { requireUser } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getPlanLabel, getUserPlan } from "@/lib/plans";
import type { ReactNode } from "react";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const plan = await getUserPlan(user.id);

  return (
    <AppLayout
      pageTitle="Dashboard"
      userName={user.name || user.email}
      planLabel={getPlanLabel(plan)}
    >
      {children}
    </AppLayout>
  );
}
