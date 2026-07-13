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
} from "lucide-react";

import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResponsibleDisclaimer } from "@/components/ui/ResponsibleDisclaimer";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateDashboardMetrics } from "@/lib/dashboard-metrics";
import { isPauseActive } from "@/lib/responsible-gaming";

export const metadata: Metadata = {
  title: "Dashboard | StakeControl",
  description:
    "Panel de control personal: resumen histórico, exposición y métricas de apuestas registradas.",
};

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function formatDecimal(value: number) {
  return value.toFixed(2);
}

export default async function DashboardPage() {
  const user = await requireUser();
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
      value: formatCurrency(metrics.profitLossTotal, preferredCurrency),
      subtitle: "Histórico acumulado",
      icon: TrendingUp,
      variant: metrics.profitLossTotal >= 0 ? ("success" as const) : ("risk" as const),
    },
    {
      id: "stake-total",
      title: "Stake total apostado",
      value: formatCurrency(metrics.stakeTotal, preferredCurrency),
      subtitle: "Suma del stake registrado",
      icon: Wallet,
      variant: "default" as const,
    },
    {
      id: "roi-historic",
      title: "ROI histórico",
      value: formatPercent(metrics.roiHistorical),
      subtitle: "profitLoss / stake total",
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
      value: formatCurrency(metrics.averageStake, preferredCurrency),
      subtitle: "Stake total / cantidad",
      icon: CircleDollarSign,
      variant: "default" as const,
    },
    {
      id: "average-odds",
      title: "Cuota promedio",
      value: formatDecimal(metrics.averageOdds),
      subtitle: "Promedio de cuotas registradas",
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

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="Dashboard"
        description="Métricas históricas, exposición y evolución de tu actividad registrada."
        icon={LayoutDashboard}
        breadcrumb="StakeControl"
        actions={
          <Link
            id="cta-register-bet"
            href={pauseIsActive ? "/limits" : "/bets/new"}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors shadow-sm ${
              pauseIsActive
                ? "bg-warning-soft text-warning-foreground hover:bg-warning-soft"
                : "bg-primary text-primary-foreground hover:bg-primary-hover shadow-primary/20"
            }`}
          >
            <PlusCircle size={15} />
            {pauseIsActive ? "Pausa activa" : "Registrar apuesta"}
          </Link>
        }
      />

      <ResponsibleDisclaimer message="El rendimiento pasado no garantiza resultados futuros." />

      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">
          Métricas principales del dashboard
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Categorías con mayor exposición histórica</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Por deporte</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{bestSport?.name ?? "Sin datos"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {bestSport ? `${bestSport.exposurePct.toFixed(2)}% del stake total` : "No hay exposición registrada."}
              </p>
            </div>
            <div className="rounded-2xl bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Por mercado</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{bestMarket?.name ?? "Sin datos"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {bestMarket ? `${bestMarket.exposurePct.toFixed(2)}% del stake total` : "No hay exposición registrada."}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
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
                title="Sin apuestas registradas"
                description="Registra tu primera apuesta para empezar a construir métricas históricas."
                action={
                  <Link
                    href="/bets/new"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                  >
                    <PlusCircle size={14} />
                    Registrar primera apuesta
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {bets.map((bet) => (
                <Link
                  key={bet.id}
                  href={`/bets/${bet.id}`}
                  className="block rounded-2xl border border-border p-4 transition hover:bg-background"
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
                    <span className="text-sm font-medium text-text-secondary">{bet.result}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>{bet.sportsbook || "Sin sportsbook"}</span>
                    <span>
                      {bet.currency} {bet.stake.toString()}
                    </span>
                    <span>Cuota {bet.odds.toString()}</span>
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
