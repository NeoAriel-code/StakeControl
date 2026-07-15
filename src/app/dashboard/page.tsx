import type { Metadata } from "next";
import Link from "next/link";
import {
  LayoutDashboard,
  PlusCircle,
  TrendingUp,
  Wallet,
  Trophy,
  Percent,
  Target,
  Sigma,
  ArrowRight,
  Activity,
  CircleDollarSign,
  ShieldCheck,
  ShieldAlert,
  PauseCircle,
  HeartPulse,
  DatabaseZap,
} from "lucide-react";

import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResponsibleDisclaimer } from "@/components/ui/ResponsibleDisclaimer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateDashboardMetrics } from "@/lib/dashboard-metrics";
import { formatMoney } from "@/lib/currency-format";
import { isPauseActive } from "@/lib/responsible-gaming";
import { formatOdds } from "@/lib/odds-format";
import { createDemoDataAction } from "@/lib/demo-actions";
import { canUseDemoData } from "@/lib/demo-access";

export const metadata: Metadata = {
  title: "Dashboard | StakeControl",
  description:
    "Panel de control personal: resumen histórico, exposición y métricas de apuestas registradas.",
};

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const canLoadDemoData = canUseDemoData(user.email);
  const [bets, allBets, limits] = await Promise.all([
    prisma.bet.findMany({
      where: { userId: user.id },
      orderBy: { placedAt: "desc" },
      take: 5,
    }),
    prisma.bet.findMany({
      where: { userId: user.id },
      orderBy: { placedAt: "desc" },
    }),
    prisma.userLimits.findUnique({
      where: { userId: user.id },
    }),
  ]);

  const metrics = calculateDashboardMetrics(
    allBets.map((bet) => ({
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

  const preferredCurrency = allBets[0]?.currency ?? user.currency;

  const metricCards = [
    {
      id: "profit-loss-total",
      title: "Profit/Loss total",
      value: formatMoney(metrics.profitLossTotal, preferredCurrency),
      subtitle: "Histórico acumulado",
      icon: TrendingUp,
      variant: metrics.profitLossTotal >= 0 ? ("success" as const) : ("risk" as const),
    },
    {
      id: "stake-total",
      title: "Stake total apostado",
      value: formatMoney(metrics.stakeTotal, preferredCurrency),
      subtitle: "Suma del stake registrado",
      icon: Wallet,
      variant: "default" as const,
    },
    {
      id: "roi-historic",
      title: "ROI histórico",
      value: formatPercent(metrics.roiHistorical),
      subtitle: "ganancia realizada / stake resuelto",
      icon: Percent,
      variant: metrics.roiHistorical >= 0 ? ("success" as const) : ("risk" as const),
    },
    {
      id: "win-rate",
      title: "Win Rate",
      value: formatPercent(metrics.winRate),
      subtitle: `${metrics.winningBetsCount} ganadas de ${metrics.resolvedBetsCount} resueltas`,
      icon: Trophy,
      variant: "default" as const,
    },
    {
      id: "average-stake",
      title: "Stake promedio",
      value: formatMoney(metrics.averageStake, preferredCurrency),
      subtitle: "Stake total / cantidad",
      icon: CircleDollarSign,
      variant: "default" as const,
    },
    {
      id: "average-odds",
      title: "Cuota promedio",
      value: formatOdds(metrics.averageOdds, user.oddsFormat),
      subtitle: user.oddsFormat === "AMERICAN" ? "Formato americano" : "Formato decimal",
      icon: Target,
      variant: "default" as const,
    },
    {
      id: "bet-count",
      title: "Cantidad de apuestas",
      value: metrics.betCount,
      subtitle: "Registros históricos",
      icon: Sigma,
      variant: "default" as const,
    },
    {
      id: "winning-streak",
      title: "Racha ganadora actual",
      value: metrics.currentWinningStreak,
      subtitle: "Apuestas ganadas consecutivas",
      icon: Activity,
      variant: metrics.currentWinningStreak > 0 ? ("success" as const) : ("default" as const),
    },
    {
      id: "losing-streak",
      title: "Racha perdedora actual",
      value: metrics.currentLosingStreak,
      subtitle: "Apuestas perdidas consecutivas",
      icon: Activity,
      variant: metrics.currentLosingStreak > 0 ? ("risk" as const) : ("default" as const),
    },
  ];

  const bestSport = metrics.sportExposure[0];
  const bestMarket = metrics.marketExposure[0];
  const pauseIsActive = isPauseActive(limits?.pauseUntil);
  const isNearLimit = Boolean(
    limits?.monthlyStakeLimit &&
      Number(limits.monthlyStakeLimit) > 0 &&
      metrics.stakeTotal >= Number(limits.monthlyStakeLimit) * 0.8
  );
  const isLimitExceeded = Boolean(
    limits?.monthlyStakeLimit &&
      Number(limits.monthlyStakeLimit) > 0 &&
      metrics.stakeTotal > Number(limits.monthlyStakeLimit)
  );
  const dashboardStatus = pauseIsActive
    ? "pause-active"
    : isLimitExceeded
      ? "limit-exceeded"
      : isNearLimit
        ? "near-limit"
        : "controlled";

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="surface-panel overflow-hidden p-6 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <StatusBadge kind={dashboardStatus} />
              <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                Vista histórica
              </span>
            </div>
            <PageHeader
              title="Dashboard"
              description="Resumen de actividad, exposición y límites personales. Úsalo como panel de autocontrol, no como predictor de resultados."
              icon={LayoutDashboard}
              breadcrumb="StakeControl"
              className="mb-0 border-0 pb-0"
            />
          </div>
          <Link
            id="cta-register-bet"
            href={pauseIsActive ? "/limits" : "/bets/new"}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-sm font-semibold transition-colors shadow-sm ${
              pauseIsActive
                ? "bg-warning-soft text-warning-foreground hover:bg-warning-soft"
                : "bg-primary text-primary-foreground hover:bg-primary-hover shadow-primary/20"
            }`}
          >
            {pauseIsActive ? <PauseCircle size={15} /> : <PlusCircle size={15} />}
            {pauseIsActive ? "Revisar pausa" : "Registrar control"}
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/health"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-strong bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-background"
          >
            <HeartPulse size={16} />
            Ver salud de juego
          </Link>
          {canLoadDemoData && allBets.length === 0 && (
            <form action={createDemoDataAction}>
              <button
                type="submit"
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary-hover"
              >
                <DatabaseZap size={16} />
                Cargar datos demo
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-background/70 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck size={16} className="text-success" />
              Lectura segura
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              El rendimiento pasado puede estar influido por muestra pequeña o varianza.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background/70 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldAlert size={16} className="text-warning" />
              Límites primero
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              No se recomienda aumentar el stake automáticamente. Considera revisar tus límites.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background/70 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Activity size={16} className="text-primary" />
              Exposición
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Si una categoría concentra demasiada actividad, podrías reducir exposición o pausar temporalmente.
            </p>
          </div>
        </div>
      </section>

      <ResponsibleDisclaimer message="El rendimiento pasado no garantiza resultados futuros." />

      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">
          Métricas principales del dashboard
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger-children">
          {metricCards.map((metric) => (
            <MetricCard
              key={metric.id}
              title={metric.title}
              value={metric.value}
              subtitle={metric.subtitle}
              icon={metric.icon}
              variant={metric.variant}
            />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="surface-section p-6">
          <h2 className="text-sm font-semibold text-foreground">Categorías con mayor exposición histórica</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Por deporte</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{bestSport?.name ?? "Sin datos"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {bestSport ? `${bestSport.exposurePct.toFixed(2)}% del stake total` : "No hay exposición registrada."}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Por mercado</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{bestMarket?.name ?? "Sin datos"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {bestMarket ? `${bestMarket.exposurePct.toFixed(2)}% del stake total` : "No hay exposición registrada."}
              </p>
            </div>
          </div>
        </section>

        <section className="surface-section p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Apuestas recientes</h2>
            <Link
              href="/bets"
              className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-secondary"
            >
              Ver historial <ArrowRight size={12} />
            </Link>
          </div>

          {bets.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="Sin registros todavía"
                description="Crea tu primer registro para empezar a construir un historial privado de control."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Link
                      href="/bets/new"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                      <PlusCircle size={14} />
                      Registrar control
                    </Link>
                    {canLoadDemoData && (
                      <form action={createDemoDataAction}>
                        <button
                          type="submit"
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border-strong bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-background"
                        >
                          <DatabaseZap size={14} />
                          Cargar demo
                        </button>
                      </form>
                    )}
                  </div>
                }
              />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {bets.map((bet) => (
                <Link
                  key={bet.id}
                  href={`/bets/${bet.id}`}
                  className="block rounded-2xl border border-border bg-background/40 p-4 transition hover:border-primary/30 hover:bg-background"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{bet.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat("es-CL", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(bet.placedAt)}
                      </p>
                    </div>
                    <StatusBadge
                      kind={bet.result === "PENDING" ? "review-required" : "reviewed"}
                      label={bet.result}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>{bet.sportsbook || "Sin sportsbook"}</span>
                    <span>
                      {bet.currency} {bet.stake.toString()}
                    </span>
                    <span>Cuota {formatOdds(Number(bet.odds), user.oddsFormat)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <DashboardCharts
        monthlyProfitLoss={metrics.monthlyProfitLoss}
        sportExposure={metrics.sportExposure}
        marketExposure={metrics.marketExposure}
        currency={preferredCurrency}
      />
    </div>
  );
}
