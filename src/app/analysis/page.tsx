import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  BrainCircuit,
  CalendarDays,
  Crown,
  Gauge,
  LockKeyhole,
  PauseCircle,
  Repeat,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { ResponsibleDisclaimer } from "@/components/ui/ResponsibleDisclaimer";
import { requireUser } from "@/lib/auth";
import {
  AiResponsibleAnalysisService,
  type AnalysisCategory,
} from "@/lib/ai-responsible-analysis-service";
import { getFeatureAccess, getPlanLabel } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Análisis IA | StakeControl",
  description:
    "Análisis premium preventivo basado en datos históricos, con reglas estrictas de juego responsable.",
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

function EmptyCategoryList({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function CategoryList({
  categories,
  currency,
  emptyMessage,
  tone,
}: {
  categories: AnalysisCategory[];
  currency: string;
  emptyMessage: string;
  tone: "neutral" | "risk" | "success";
}) {
  if (categories.length === 0) {
    return <EmptyCategoryList message={emptyMessage} />;
  }

  const badgeClassName =
    tone === "risk"
      ? "bg-danger-soft text-danger"
      : tone === "success"
        ? "bg-success-soft text-success"
        : "bg-accent text-accent-foreground";

  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <article key={category.name} className="rounded-2xl border border-border bg-background p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{category.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {category.betCount} apuestas · {formatCurrency(category.stake, currency)} expuestos ·{" "}
                {formatPercent(category.exposurePct)} del stake
              </p>
            </div>
            <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClassName}`}>
              ROI {formatPercent(category.roi)}
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Resultado histórico: {formatCurrency(category.profitLoss, currency)}.
          </p>
        </article>
      ))}
    </div>
  );
}

function UpgradeGate({ planLabel }: { planLabel: string }) {
  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Análisis IA"
        description="Disponible para usuarios Premium, con enfoque preventivo y sin recomendaciones de apuesta."
        icon={BrainCircuit}
        breadcrumb="StakeControl"
      />

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning-soft px-3 py-1 text-xs font-semibold text-warning-foreground">
              <LockKeyhole size={12} />
              {planLabel}
            </div>
            <h2 className="mt-4 text-2xl font-bold text-foreground">Función Premium bloqueada</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              El análisis IA responsable revisa tus datos históricos del mes, exposición, frecuencia, rachas y
              desempeño por categorías. No entrega predicciones ni recomendaciones de apuesta.
            </p>
          </div>
          <Link
            href="/upgrade"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            <Crown size={16} />
            Ver Premium
          </Link>
        </div>
      </section>
    </section>
  );
}

export default async function AnalysisPage() {
  const user = await requireUser();
  const access = await getFeatureAccess(user.id, "ai_responsible_analysis");
  const planLabel = getPlanLabel(access.plan);

  if (!access.allowed) {
    return (
      <AppLayout pageTitle="Análisis IA" userName={user.name || user.email} planLabel={planLabel}>
        <UpgradeGate planLabel={planLabel} />
      </AppLayout>
    );
  }

  const service = new AiResponsibleAnalysisService();
  const report = await service.generateMonthlyReport(user.id);
  const currency = user.currency;

  const metricCards = [
    {
      id: "total-stake",
      title: "Gasto total",
      value: formatCurrency(report.totalStake, currency),
      subtitle: report.periodLabel,
      icon: Wallet,
      variant: "default" as const,
    },
    {
      id: "stake-variation",
      title: "Variación de stake",
      value: formatPercent(report.stakeVariationPct),
      subtitle: "Frente al promedio del mes anterior",
      icon: Gauge,
      variant: report.stakeVariationPct > 0 ? ("warning" as const) : ("default" as const),
    },
    {
      id: "frequency",
      title: "Frecuencia",
      value: `${report.betsPerWeek}`,
      subtitle: `Apuestas por semana · ${report.activeDays} días activos`,
      icon: CalendarDays,
      variant: report.betsPerWeek > 10 ? ("warning" as const) : ("default" as const),
    },
    {
      id: "current-loss-streak",
      title: "Racha perdedora",
      value: report.currentLosingStreak,
      subtitle: `Máxima histórica: ${report.maxLosingStreak}`,
      icon: TrendingDown,
      variant: report.currentLosingStreak > 0 ? ("risk" as const) : ("default" as const),
    },
    {
      id: "current-win-streak",
      title: "Racha ganadora",
      value: report.currentWinningStreak,
      subtitle: `Máxima histórica: ${report.maxWinningStreak}`,
      icon: TrendingUp,
      variant: "default" as const,
    },
    {
      id: "total-bets",
      title: "Apuestas del mes",
      value: report.totalBets,
      subtitle: `${report.resolvedBets} resueltas`,
      icon: Repeat,
      variant: report.totalBets < 30 ? ("warning" as const) : ("default" as const),
    },
  ];

  return (
    <AppLayout pageTitle="Análisis IA" userName={user.name || user.email} planLabel={planLabel}>
      <section className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Análisis IA responsable"
          description="Lectura premium preventiva basada en tus datos históricos. No predice resultados ni recomienda apuestas."
          icon={BrainCircuit}
          breadcrumb="StakeControl"
        />

        <ResponsibleDisclaimer message="En tus datos históricos pueden existir sesgos por muestra pequeña, varianza o cambios de conducta. No se recomienda aumentar el stake automáticamente." />

        {report.warnings.length > 0 && (
          <section className="rounded-2xl border border-warning/30 bg-warning-soft p-4 text-warning-foreground">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5 text-warning" />
              <div>
                <h2 className="text-sm font-semibold">Advertencia de muestra pequeña</h2>
                <p className="mt-1 text-sm">{report.warnings[0]}</p>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldAlert size={20} className="mt-0.5 text-primary" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                Resumen histórico del mes
              </p>
              <h2 className="mt-2 text-2xl font-bold text-foreground capitalize">{report.periodLabel}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{report.summary}</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="analysis-metrics-heading">
          <h2 id="analysis-metrics-heading" className="sr-only">
            Métricas del análisis IA
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

        <section className="grid gap-6 xl:grid-cols-3">
          <article className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Mayor exposición</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Categorías con mayor stake registrado durante el mes.
            </p>
            <div className="mt-5">
              <CategoryList
                categories={report.topExposureCategories}
                currency={currency}
                emptyMessage="No hay categorías con exposición registrada este mes."
                tone="neutral"
              />
            </div>
          </article>

          <article className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Peor desempeño histórico</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Lectura histórica para reducir exposición o pausar temporalmente si corresponde.
            </p>
            <div className="mt-5">
              <CategoryList
                categories={report.worstHistoricalCategories}
                currency={currency}
                emptyMessage="Aún no hay suficientes categorías históricas para comparar desempeño."
                tone="risk"
              />
            </div>
          </article>

          <article className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Mejor desempeño histórico</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              En tus datos históricos, esto no implica ventaja futura ni recomendación de aumentar exposición.
            </p>
            <div className="mt-5">
              <CategoryList
                categories={report.bestHistoricalCategories}
                currency={currency}
                emptyMessage="Aún no hay suficientes categorías históricas para comparar desempeño."
                tone="success"
              />
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <PauseCircle size={20} className="mt-0.5 text-warning" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Mensajes preventivos</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {report.preventiveMessages.map((message) => (
                  <div key={message} className="rounded-2xl bg-background p-4 text-sm text-muted-foreground">
                    {message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </section>
    </AppLayout>
  );
}
