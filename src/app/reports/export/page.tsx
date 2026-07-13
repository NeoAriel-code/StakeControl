import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Check, Crown, Download, FileSpreadsheet, LockKeyhole } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireUser } from "@/lib/auth";
import { getFeatureAccess, getPlanLabel } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Exportar CSV | StakeControl",
  description: "Exportación CSV de apuestas con filtros por fecha y columnas según el plan del usuario.",
};

const BASIC_COLUMNS = [
  "fecha",
  "sportsbook",
  "deporte",
  "liga",
  "mercado",
  "selección",
  "tipo",
  "stake",
  "cuota",
  "resultado",
  "netProfit",
  "moneda",
];

const PREMIUM_COLUMNS = [
  "ticketCode",
  "notas",
  "categoría",
  "origen manual/OCR",
  "confidenceScore",
];

function getDefaultMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    from: from.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

function ColumnList({ columns }: { columns: string[] }) {
  return (
    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
      {columns.map((column) => (
        <li key={column} className="flex items-center gap-2 text-sm text-foreground">
          <Check size={14} className="text-success" />
          <span>{column}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function ExportReportsPage() {
  const user = await requireUser();
  const [basicExportAccess, advancedExportAccess] = await Promise.all([
    getFeatureAccess(user.id, "csv_export_basic"),
    getFeatureAccess(user.id, "export_advanced"),
  ]);
  const planLabel = getPlanLabel(basicExportAccess.plan);
  const defaultRange = getDefaultMonthRange();

  return (
    <AppLayout pageTitle="Exportar CSV" userName={user.name || user.email} planLabel={planLabel} plan={basicExportAccess.plan}>
      <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Exportar CSV"
          description="Descarga tus apuestas filtradas por fecha. El archivo siempre se genera solo con datos de tu cuenta."
          icon={FileSpreadsheet}
          breadcrumb="StakeControl"
        />

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                Filtros
              </p>
              <h2 className="mt-2 text-2xl font-bold text-foreground">Rango de fechas</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                El filtro usa la fecha de registro de la apuesta. En Free se descarga el CSV básico; Premium agrega
                columnas de ticket, notas, categoría, origen y confianza OCR.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              {advancedExportAccess.allowed ? <Crown size={13} /> : <LockKeyhole size={13} />}
              {advancedExportAccess.allowed ? "Exportación Premium" : "Exportación básica"}
            </div>
          </div>

          {basicExportAccess.allowed ? (
            <form action="/api/bets/export.csv" method="get" className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
              <div className="space-y-2">
                <label htmlFor="from" className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CalendarDays size={15} />
                  Fecha desde
                </label>
                <input
                  id="from"
                  name="from"
                  type="date"
                  defaultValue={defaultRange.from}
                  className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="to" className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CalendarDays size={15} />
                  Fecha hasta
                </label>
                <input
                  id="to"
                  name="to"
                  type="date"
                  defaultValue={defaultRange.to}
                  className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
              >
                <Download size={16} />
                Descargar CSV
              </button>
            </form>
          ) : (
            <div className="mt-6 rounded-2xl border border-warning/30 bg-warning-soft p-4 text-sm text-warning-foreground">
              Tu plan no tiene exportación CSV activa.
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Free</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">CSV básico</h2>
            <ColumnList columns={BASIC_COLUMNS} />
          </article>

          <article className="rounded-3xl border border-primary/20 bg-card p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Premium</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">Columnas adicionales</h2>
            <ColumnList columns={PREMIUM_COLUMNS} />
            {!advancedExportAccess.allowed && (
              <Link
                href="/upgrade"
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border-strong px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-background"
              >
                <Crown size={15} />
                Ver Premium
              </Link>
            )}
          </article>
        </section>
      </section>
    </AppLayout>
  );
}
