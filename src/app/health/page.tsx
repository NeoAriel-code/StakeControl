import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  DatabaseZap,
  Gauge,
  HeartPulse,
  PauseCircle,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ResponsibleDisclaimer } from "@/components/ui/ResponsibleDisclaimer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createDemoDataAction } from "@/lib/demo-actions";
import { requireUser } from "@/lib/auth";
import { calculateDashboardMetrics } from "@/lib/dashboard-metrics";
import { formatMoney } from "@/lib/currency-format";
import {
  calculateResponsibleHealth,
  type HealthSignal,
} from "@/lib/health-score";
import { getPlanLabel, getUserPlan } from "@/lib/plans";
import prisma from "@/lib/prisma";
import { getCurrentStakeTotals, isPauseActive } from "@/lib/responsible-gaming";

export const metadata: Metadata = {
  title: "Salud de juego | StakeControl",
  description: "Vista preventiva de límites, rachas, exposición y señales de autocontrol.",
};

type HealthPageProps = {
  searchParams: Promise<{
    demo?: string;
  }>;
};

function signalClassName(severity: HealthSignal["severity"]) {
  switch (severity) {
    case "danger":
      return "border-danger-border bg-danger-soft";
    case "warning":
      return "border-warning/30 bg-warning-soft";
    case "good":
      return "border-success/30 bg-success-soft";
    default:
      return "border-border bg-background";
  }
}

function signalIconClassName(severity: HealthSignal["severity"]) {
  switch (severity) {
    case "danger":
      return "text-danger";
    case "warning":
      return "text-warning";
    case "good":
      return "text-success";
    default:
      return "text-primary";
  }
}

function formatPercent(value: number) {
  return `${value.toFixed(0)}%`;
}

function DemoDataForm({ disabled }: { disabled: boolean }) {
  return (
    <form action={createDemoDataAction}>
      <button
        type="submit"
        disabled={disabled}
        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        <DatabaseZap size={16} />
        {disabled ? "Datos demo ya cargados" : "Cargar datos demo"}
      </button>
    </form>
  );
}

export default async function HealthPage({ searchParams }: HealthPageProps) {
  const [user, resolvedSearchParams] = await Promise.all([requireUser(), searchParams]);
  const [plan, bets, limits, totals, unreadAlerts, highSeverityAlerts, existingDemoBet] = await Promise.all([
    getUserPlan(user.id),
    prisma.bet.findMany({
      where: { userId: user.id },
      orderBy: { placedAt: "desc" },
    }),
    prisma.userLimits.findUnique({
      where: { userId: user.id },
    }),
    getCurrentStakeTotals(user.id),
    prisma.responsibleGamingAlert.count({
      where: {
        userId: user.id,
        acknowledgedAt: null,
      },
    }),
    prisma.responsibleGamingAlert.count({
      where: {
        userId: user.id,
        acknowledgedAt: null,
        severity: "HIGH",
      },
    }),
    prisma.bet.findFirst({
      where: {
        userId: user.id,
        ticketCode: {
          startsWith: "DEMO-STC",
        },
      },
      select: { id: true },
    }),
  ]);

  const metrics = calculateDashboardMetrics(
    bets.map((bet) => ({
      id: bet.id,
      title: bet.title,
      sport: bet.sport,
      market: bet.market,
      result: bet.result,
      stake: Number(bet.stake),
      odds: Number(bet.odds),
      profitLoss: bet.profitLoss ? Number(bet.profitLoss) : 0,
      placedAt: bet.placedAt,
    }))
  );
  const monthlyLimit = limits?.monthlyStakeLimit ? Number(limits.monthlyStakeLimit) : null;
  const weeklyLimit = limits?.weeklyStakeLimit ? Number(limits.weeklyStakeLimit) : null;
  const dailyLimit = limits?.dailyStakeLimit ? Number(limits.dailyStakeLimit) : null;
  const health = calculateResponsibleHealth({
    betCount: metrics.betCount,
    currentLosingStreak: metrics.currentLosingStreak,
    sportExposure: metrics.sportExposure,
    marketExposure: metrics.marketExposure,
    dailyLimit: { current: totals.dailyStake, limit: dailyLimit },
    weeklyLimit: { current: totals.weeklyStake, limit: weeklyLimit },
    monthlyLimit: { current: totals.monthlyStake, limit: monthlyLimit },
    pauseActive: isPauseActive(limits?.pauseUntil),
    unreadAlertCount: unreadAlerts,
    highSeverityAlertCount: highSeverityAlerts,
  });
  const hasDemoData = Boolean(existingDemoBet);
  const demoMessage =
    resolvedSearchParams.demo === "created"
      ? "Datos demo cargados para esta cuenta."
      : resolvedSearchParams.demo === "exists"
        ? "Esta cuenta ya tenía datos demo cargados."
        : null;

  const exposureRows = [
    {
      id: "sport",
      label: "Deporte más expuesto",
      value: metrics.sportExposure[0]?.name ?? "Sin datos",
      helper: metrics.sportExposure[0]
        ? `${formatPercent(metrics.sportExposure[0].exposurePct)} del stake histórico`
        : "Aparecerá al registrar apuestas.",
    },
    {
      id: "market",
      label: "Mercado más expuesto",
      value: metrics.marketExposure[0]?.name ?? "Sin datos",
      helper: metrics.marketExposure[0]
        ? `${formatPercent(metrics.marketExposure[0].exposurePct)} del stake histórico`
        : "Aparecerá al registrar apuestas.",
    },
  ];

  return (
    <AppLayout pageTitle="Salud" userName={user.name || user.email} planLabel={getPlanLabel(plan)} plan={plan}>
      <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Salud de juego"
          description="Una vista preventiva de tu actividad histórica: límites, rachas, alertas y exposición. No entrega picks ni recomendaciones de apuesta."
          icon={HeartPulse}
          breadcrumb="StakeControl"
          actions={<StatusBadge kind={health.status} />}
        />

        {demoMessage && (
          <div className="rounded-2xl border border-success/30 bg-success-soft px-5 py-4 text-sm font-semibold text-success">
            {demoMessage}
          </div>
        )}

        <section className="surface-panel overflow-hidden p-6 sm:p-7">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-primary/20 bg-primary/10 text-3xl font-black text-primary">
                  {health.score}
                </div>
                <div>
                  <StatusBadge kind={health.status} />
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground">{health.title}</h2>
                </div>
              </div>
              <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">{health.summary}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/limits"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-strong bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-background"
                >
                  <SlidersHorizontal size={16} />
                  Ajustar límites
                </Link>
                <DemoDataForm disabled={hasDemoData} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Gauge size={16} className="text-primary" />
                  Stake del mes
                </div>
                <p className="mt-3 text-2xl font-black text-foreground">
                  {formatMoney(totals.monthlyStake, user.currency)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {monthlyLimit ? `Límite: ${formatMoney(monthlyLimit, user.currency)}` : "Sin límite mensual"}
                </p>
              </article>
              <article className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Activity size={16} className="text-primary" />
                  Racha actual
                </div>
                <p className="mt-3 text-2xl font-black text-foreground">
                  {metrics.currentLosingStreak > 0
                    ? `${metrics.currentLosingStreak} pérdidas`
                    : `${metrics.currentWinningStreak} ganadas`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Solo considera apuestas resueltas.</p>
              </article>
              <article className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Bell size={16} className="text-primary" />
                  Alertas pendientes
                </div>
                <p className="mt-3 text-2xl font-black text-foreground">{unreadAlerts}</p>
                <p className="mt-1 text-xs text-muted-foreground">{highSeverityAlerts} de alta prioridad.</p>
              </article>
              <article className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <BarChart3 size={16} className="text-primary" />
                  Historial
                </div>
                <p className="mt-3 text-2xl font-black text-foreground">{metrics.betCount}</p>
                <p className="mt-1 text-xs text-muted-foreground">Apuestas registradas.</p>
              </article>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <section className="surface-section p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Señales preventivas</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Lectura histórica y preventiva. No se recomienda aumentar el stake automáticamente.
                </p>
              </div>
              <AlertTriangle size={20} className="text-warning" />
            </div>

            {health.signals.length === 0 ? (
              <div className="mt-5">
                <EmptyState title="Sin señales preventivas" description="No hay señales relevantes con los datos actuales." />
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {health.signals.map((signal) => (
                  <article key={signal.id} className={`rounded-2xl border p-4 ${signalClassName(signal.severity)}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{signal.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{signal.description}</p>
                      </div>
                      <ShieldCheck size={18} className={signalIconClassName(signal.severity)} />
                    </div>
                    {signal.actionHref && signal.actionLabel && (
                      <Link
                        href={signal.actionHref}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:text-secondary"
                      >
                        {signal.actionLabel}
                        <ArrowRight size={12} />
                      </Link>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="surface-section p-6">
              <h2 className="text-lg font-semibold text-foreground">Exposición</h2>
              <div className="mt-4 space-y-3">
                {exposureRows.map((row) => (
                  <article key={row.id} className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{row.label}</p>
                    <p className="mt-2 text-lg font-black text-foreground">{row.value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{row.helper}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="surface-section p-6">
              <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <PauseCircle size={18} className="text-warning" />
                Próximo paso sugerido
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Si estás cerca de un límite, con racha negativa o con exposición concentrada, considera revisar tus
                límites o activar una pausa temporal. Esta pantalla no sugiere mercados ni selecciones.
              </p>
              <Link
                href="/limits"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
              >
                Revisar límites
                <ArrowRight size={14} />
              </Link>
            </section>
          </aside>
        </div>

        <ResponsibleDisclaimer message="En tus datos históricos, las señales pueden estar influidas por muestra pequeña o varianza." />
      </section>
    </AppLayout>
  );
}
