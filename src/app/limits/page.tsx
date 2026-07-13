import type { Metadata } from "next";
import { Gauge, ShieldAlert, ShieldCheck, ShieldX, PauseCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LimitsForm } from "@/components/limits/LimitsForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireUser } from "@/lib/auth";
import { getPlanLabel, getUserPlan } from "@/lib/plans";
import prisma from "@/lib/prisma";
import {
  formatPauseMessage,
  getCurrentStakeTotals,
  getLimitStatus,
  isPauseActive,
  type LimitStatus,
} from "@/lib/responsible-gaming";

export const metadata: Metadata = {
  title: "Límites | StakeControl",
  description: "Configura límites personales, pausas voluntarias y revisa alertas de juego responsable.",
};

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function statusConfig(status: LimitStatus) {
  switch (status) {
    case "PAUSE_ACTIVE":
      return {
        label: "Pausa activa",
        className: "bg-warning-soft text-warning border border-warning/30",
        Icon: PauseCircle,
      };
    case "LIMIT_EXCEEDED":
      return {
        label: "Límite superado",
        className: "bg-danger-soft text-danger border border-danger-border",
        Icon: ShieldX,
      };
    case "NEAR_LIMIT":
      return {
        label: "Cerca del límite",
        className: "bg-warning-soft text-warning border border-warning/30",
        Icon: ShieldAlert,
      };
    default:
      return {
        label: "Dentro del límite",
        className: "bg-success-soft text-success border border-success/30",
        Icon: ShieldCheck,
      };
  }
}

function StatusBadge({ status }: { status: LimitStatus }) {
  const { label, className, Icon } = statusConfig(status);

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
      <Icon size={12} />
      {label}
    </span>
  );
}

type LimitSummaryItem = {
  id: string;
  label: string;
  summaryText: string;
  status: LimitStatus;
  helperMessage?: string | null;
};

export default async function LimitsPage() {
  const user = await requireUser();
  const [plan, limits, totals, recentAlerts] = await Promise.all([
    getUserPlan(user.id),
    prisma.userLimits.findUnique({
      where: { userId: user.id },
    }),
    getCurrentStakeTotals(user.id),
    prisma.responsibleGamingAlert.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const dailyLimit = limits?.dailyStakeLimit ? Number(limits.dailyStakeLimit) : null;
  const weeklyLimit = limits?.weeklyStakeLimit ? Number(limits.weeklyStakeLimit) : null;
  const monthlyLimit = limits?.monthlyStakeLimit ? Number(limits.monthlyStakeLimit) : null;
  const maxSingleStake = limits?.maxStakePerBet ? Number(limits.maxStakePerBet) : null;

  const dailyStatus = getLimitStatus({
    currentValue: totals.dailyStake,
    limitValue: dailyLimit,
    pauseUntil: limits?.pauseUntil,
  });
  const weeklyStatus = getLimitStatus({
    currentValue: totals.weeklyStake,
    limitValue: weeklyLimit,
    pauseUntil: limits?.pauseUntil,
  });
  const monthlyStatus = getLimitStatus({
    currentValue: totals.monthlyStake,
    limitValue: monthlyLimit,
    pauseUntil: limits?.pauseUntil,
  });
  const overallStatus = isPauseActive(limits?.pauseUntil)
    ? "PAUSE_ACTIVE"
    : monthlyStatus === "LIMIT_EXCEEDED" || weeklyStatus === "LIMIT_EXCEEDED" || dailyStatus === "LIMIT_EXCEEDED"
      ? "LIMIT_EXCEEDED"
      : monthlyStatus === "NEAR_LIMIT" || weeklyStatus === "NEAR_LIMIT" || dailyStatus === "NEAR_LIMIT"
        ? "NEAR_LIMIT"
        : "WITHIN_LIMIT";

  const limitItems: LimitSummaryItem[] = [
    {
      id: "daily",
      label: "Límite diario",
      summaryText: dailyLimit
        ? `${formatCurrency(totals.dailyStake, user.currency)} de ${formatCurrency(dailyLimit, user.currency)}`
        : "Sin límite configurado",
      status: dailyStatus,
    },
    {
      id: "weekly",
      label: "Límite semanal",
      summaryText: weeklyLimit
        ? `${formatCurrency(totals.weeklyStake, user.currency)} de ${formatCurrency(weeklyLimit, user.currency)}`
        : "Sin límite configurado",
      status: weeklyStatus,
    },
    {
      id: "monthly",
      label: "Límite mensual",
      summaryText: monthlyLimit
        ? `${formatCurrency(totals.monthlyStake, user.currency)} de ${formatCurrency(monthlyLimit, user.currency)}`
        : "Sin límite configurado",
      status: monthlyStatus,
      helperMessage:
        monthlyStatus === "NEAR_LIMIT"
          ? "Estás cerca de tu límite mensual. Considera revisar tu presupuesto antes de registrar nuevas apuestas."
          : null,
    },
    {
      id: "single",
      label: "Stake máximo por apuesta",
      summaryText: maxSingleStake
        ? `Configurado en ${formatCurrency(maxSingleStake, user.currency)}`
        : "Sin límite configurado",
      status: maxSingleStake ? "WITHIN_LIMIT" : "WITHIN_LIMIT",
      helperMessage: maxSingleStake
        ? `Se mostrará una advertencia fuerte si intentas guardar una apuesta sobre ${formatCurrency(
            maxSingleStake,
            user.currency
          )}.`
        : "Aún no has configurado un stake máximo por apuesta.",
    },
  ];

  return (
    <AppLayout pageTitle="Límites" userName={user.name || user.email} planLabel={getPlanLabel(plan)}>
      <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Límites y juego responsable"
          description="Define topes personales, activa pausas voluntarias y sigue el estado actual de tu presupuesto."
          icon={Gauge}
          breadcrumb="StakeControl"
          actions={<StatusBadge status={overallStatus} />}
        />

        {isPauseActive(limits?.pauseUntil) && (
          <div className="rounded-2xl border border-warning/30 bg-warning-soft px-5 py-4 text-sm text-warning-foreground">
            {formatPauseMessage(limits!.pauseUntil!)}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Configuración personal</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Los límites se guardan por usuario y se aplican al registrar apuestas y tickets.
              </p>
              <div className="mt-6">
                <LimitsForm
                  limits={
                    limits
                      ? {
                          dailyStakeLimit: limits.dailyStakeLimit?.toString() ?? null,
                          weeklyStakeLimit: limits.weeklyStakeLimit?.toString() ?? null,
                          monthlyStakeLimit: limits.monthlyStakeLimit?.toString() ?? null,
                          maxStakePerBet: limits.maxStakePerBet?.toString() ?? null,
                          pauseUntil: limits.pauseUntil?.toISOString() ?? null,
                        }
                      : null
                  }
                />
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Estado actual</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {limitItems.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.label}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.summaryText}</p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    {item.helperMessage && (
                      <p className="mt-3 text-sm text-muted-foreground">{item.helperMessage}</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Resumen rápido</h2>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Stake del día
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">{formatCurrency(totals.dailyStake, user.currency)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Stake de la semana
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">{formatCurrency(totals.weeklyStake, user.currency)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Stake del mes
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">{formatCurrency(totals.monthlyStake, user.currency)}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Alertas recientes</h2>
              {recentAlerts.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Aún no se generaron alertas de juego responsable.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {recentAlerts.map((alert) => (
                    <article key={alert.id} className="rounded-2xl border border-border bg-background p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                        <span className="text-xs font-semibold text-muted-foreground">{alert.severity}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{alert.message}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </section>
    </AppLayout>
  );
}
