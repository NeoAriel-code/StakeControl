import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Check, Crown, LockKeyhole } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireUser } from "@/lib/auth";
import { getFeatureAccess, getPlanLabel } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Reportes | StakeControl",
  description: "Superficie para reportes mensuales, segmentación avanzada y exportación extendida.",
};

const PREMIUM_REPORT_FEATURES = [
  "Historial completo sin límite de 90 días",
  "Segmentación avanzada por deporte, mercado y sportsbook",
  "Informe mensual consolidado",
  "Exportaciones avanzadas",
  "Lectura de alertas inteligentes en contexto",
];

export default async function ReportsPage() {
  const user = await requireUser();
  const [advancedSegmentationAccess, monthlyReportAccess, advancedExportAccess] = await Promise.all([
    getFeatureAccess(user.id, "advanced_segmentation"),
    getFeatureAccess(user.id, "monthly_report"),
    getFeatureAccess(user.id, "export_advanced"),
  ]);

  const plan = advancedSegmentationAccess.plan;
  const hasPremiumAccess =
    advancedSegmentationAccess.allowed && monthlyReportAccess.allowed && advancedExportAccess.allowed;

  return (
    <AppLayout
      pageTitle="Reportes"
      userName={user.name || user.email}
      planLabel={getPlanLabel(plan)}
      plan={plan}
    >
      <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Reportes y análisis"
          description="Consulta exportaciones y accede a análisis avanzados según tu plan."
          icon={BarChart3}
          breadcrumb="StakeControl"
        />

        {hasPremiumAccess ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <Crown size={20} className="mt-0.5 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Espacio Premium habilitado</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Tu plan ya tiene acceso a reportes avanzados. Esta página queda lista como base para las próximas
                    iteraciones de segmentación, exportación extendida e informe mensual.
                  </p>
                </div>
              </div>
              <Link
                href="/reports/export"
                className="inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
              >
                Exportar CSV
              </Link>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning-soft px-3 py-1 text-xs font-semibold text-warning-foreground">
                  <LockKeyhole size={12} />
                  Disponible en Premium
                </div>
                <h2 className="mt-4 text-2xl font-bold text-foreground">Funciones avanzadas bloqueadas en Free</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  El historial extendido, la segmentación avanzada, los informes mensuales y la exportación avanzada
                  están disponibles con Premium.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/reports/export"
                  className="inline-flex rounded-xl border border-border-strong px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-background"
                >
                  Exportar CSV básico
                </Link>
                <Link
                  href="/upgrade"
                  className="inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
                >
                  Ver comparación de planes
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Free</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">Herramientas esenciales</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Dashboard básico, exportación CSV simple, alertas por límites y navegación histórica acotada.
            </p>
          </article>

          <article className="rounded-3xl border border-primary/20 bg-card p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Premium</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">Capa analítica avanzada</h2>
            <ul className="mt-4 space-y-3">
              {PREMIUM_REPORT_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                  <Check size={16} className="mt-0.5 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </section>
    </AppLayout>
  );
}
