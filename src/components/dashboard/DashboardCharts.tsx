"use client";

import { formatMoney } from "@/lib/currency-format";

type MonthlyProfitLossDatum = {
  month: string;
  profitLoss: number;
};

type ExposureDatum = {
  name: string;
  stake: number;
  exposurePct: number;
};

type DashboardChartsProps = {
  monthlyProfitLoss: MonthlyProfitLossDatum[];
  sportExposure: ExposureDatum[];
  marketExposure: ExposureDatum[];
  currency: string;
};

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-2xl border border-dashed border-border bg-background/60 px-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function formatMonth(month: string) {
  const [year, numericMonth] = month.split("-");
  const date = new Date(Number(year), Number(numericMonth) - 1, 1);
  return new Intl.DateTimeFormat("es-CL", { month: "short", year: "2-digit" }).format(date);
}

export function DashboardCharts({
  monthlyProfitLoss,
  sportExposure,
  marketExposure,
  currency,
}: DashboardChartsProps) {
  const monthlyMax = Math.max(...monthlyProfitLoss.map((entry) => Math.abs(entry.profitLoss)), 0);
  const topSportExposure = sportExposure.slice(0, 6);
  const topMarketExposure = marketExposure.slice(0, 6);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <section className="surface-panel p-6 xl:col-span-3">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">Evolución mensual de Profit/Loss</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            El rendimiento pasado no garantiza resultados futuros.
          </p>
        </div>

        {monthlyProfitLoss.length === 0 ? (
          <EmptyChartState message="No hay suficientes datos históricos para mostrar evolución mensual." />
        ) : (
          <div className="grid min-h-[300px] grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="flex h-[300px] items-end gap-3 rounded-2xl border border-border bg-background p-4">
              {monthlyProfitLoss.map((entry) => {
                const heightPct =
                  monthlyMax === 0
                    ? 8
                    : Math.max((Math.abs(entry.profitLoss) / monthlyMax) * 100, 8);
                const isPositive = entry.profitLoss >= 0;

                return (
                  <div key={entry.month} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {formatMoney(entry.profitLoss, currency)}
                    </span>
                    <div className="flex h-[220px] w-full items-end rounded-xl bg-card/70 px-2 py-2">
                      <div
                        className={`w-full rounded-lg ${isPositive ? "bg-success/70" : "bg-danger/70"}`}
                        style={{ height: `${heightPct}%` }}
                        title={`${formatMonth(entry.month)}: ${formatMoney(entry.profitLoss, currency)}`}
                      />
                    </div>
                    <span className="text-xs font-semibold text-text-secondary">
                      {formatMonth(entry.month)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Resumen mensual
              </p>
              <div className="mt-4 space-y-3">
                {monthlyProfitLoss.map((entry) => (
                  <div key={entry.month} className="rounded-xl bg-card p-3">
                    <p className="text-xs font-semibold text-text-secondary">{formatMonth(entry.month)}</p>
                    <p
                      className={`mt-1 text-sm font-semibold ${
                        entry.profitLoss >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {formatMoney(entry.profitLoss, currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="surface-section p-6">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">Exposición por deporte</h2>
          <p className="mt-1 text-xs text-muted-foreground">Participación del stake total por categoría.</p>
        </div>
        {topSportExposure.length === 0 ? (
          <EmptyChartState message="No hay exposición por deporte para mostrar." />
        ) : (
          <div className="space-y-3">
            {topSportExposure.map((entry) => (
              <div key={entry.name} className="rounded-2xl border border-border bg-background p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-foreground">{entry.name}</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {entry.exposurePct.toFixed(2)}%
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-card">
                  <div
                    className="h-full rounded-full bg-secondary"
                    style={{ width: `${Math.max(entry.exposurePct, 4)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatMoney(entry.stake, currency)} del stake total
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="surface-section p-6 xl:col-span-2">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">Exposición por mercado</h2>
          <p className="mt-1 text-xs text-muted-foreground">Participación del stake total por mercado.</p>
        </div>
        {topMarketExposure.length === 0 ? (
          <EmptyChartState message="No hay exposición por mercado para mostrar." />
        ) : (
          <div className="space-y-3">
            {topMarketExposure.map((entry) => (
              <div key={entry.name} className="rounded-2xl border border-border bg-background p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-foreground">{entry.name}</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {formatMoney(entry.stake, currency)} · {entry.exposurePct.toFixed(2)}%
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-card">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(entry.exposurePct, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
