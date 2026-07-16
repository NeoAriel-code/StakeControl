import Link from "next/link";
import { BetResult } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { DeleteBetButton } from "@/components/bets/DeleteBetButton";
import { QuickBetResultSelect } from "@/components/bets/QuickBetResultSelect";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  getFeatureAccess,
  getHistoryCutoffDate,
  getPlanLabel,
} from "@/lib/plans";
import { isPauseActive } from "@/lib/responsible-gaming";
import { formatOdds } from "@/lib/odds-format";

const PAGE_SIZE = 10;

type BetsPageProps = {
  searchParams: Promise<{
    page?: string;
    from?: string;
    to?: string;
    sportsbook?: string;
    sport?: string;
    market?: string;
    result?: string;
    minStake?: string;
    maxStake?: string;
    minOdds?: string;
    maxOdds?: string;
  }>;
};

function parsePositiveNumber(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildPageHref(
  currentSearchParams: Awaited<BetsPageProps["searchParams"]>,
  page: number
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(currentSearchParams)) {
    if (!value || key === "page") continue;
    params.set(key, value);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/bets?${query}` : "/bets";
}

function buildWhereClause(
  userId: string,
  searchParams: Awaited<BetsPageProps["searchParams"]>
): Prisma.BetWhereInput {
  const from = searchParams.from ? new Date(`${searchParams.from}T00:00:00`) : undefined;
  const to = searchParams.to ? new Date(`${searchParams.to}T23:59:59.999`) : undefined;
  const minStake = parsePositiveNumber(searchParams.minStake);
  const maxStake = parsePositiveNumber(searchParams.maxStake);
  const minOdds = parsePositiveNumber(searchParams.minOdds);
  const maxOdds = parsePositiveNumber(searchParams.maxOdds);

  const where: Prisma.BetWhereInput = {
    userId,
    placedAt:
      from || to
        ? {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          }
        : undefined,
    sportsbook: searchParams.sportsbook
      ? {
          contains: searchParams.sportsbook,
        }
      : undefined,
    sport: searchParams.sport
      ? {
          contains: searchParams.sport,
        }
      : undefined,
    market: searchParams.market
      ? {
          contains: searchParams.market,
        }
      : undefined,
    result:
      searchParams.result && Object.values(BetResult).includes(searchParams.result as BetResult)
        ? (searchParams.result as BetResult)
        : undefined,
    stake:
      minStake !== undefined || maxStake !== undefined
        ? {
            ...(minStake !== undefined ? { gte: minStake } : {}),
            ...(maxStake !== undefined ? { lte: maxStake } : {}),
          }
        : undefined,
    odds:
      minOdds !== undefined || maxOdds !== undefined
        ? {
            ...(minOdds !== undefined ? { gte: minOdds } : {}),
            ...(maxOdds !== undefined ? { lte: maxOdds } : {}),
          }
        : undefined,
  };

  return where;
}

export default async function BetsPage({ searchParams }: BetsPageProps) {
  const user = await requireUser();
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, Number(resolvedSearchParams.page ?? "1") || 1);
  const [historyAccess, advancedExportAccess] = await Promise.all([
    getFeatureAccess(user.id, "history_full"),
    getFeatureAccess(user.id, "export_advanced"),
  ]);
  const historyCutoffDate = getHistoryCutoffDate();
  const where = buildWhereClause(user.id, resolvedSearchParams);

  if (!historyAccess.allowed) {
    const placedAtFilter =
      where.placedAt &&
      typeof where.placedAt === "object" &&
      !(where.placedAt instanceof Date) &&
      !Array.isArray(where.placedAt)
        ? (where.placedAt as Prisma.DateTimeFilter)
        : {};

    where.placedAt = {
      ...placedAtFilter,
      gte: historyCutoffDate,
    };
  }

  const [bets, totalCount, limits] = await Promise.all([
    prisma.bet.findMany({
      where,
      orderBy: { placedAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.bet.count({ where }),
    prisma.userLimits.findUnique({
      where: { userId: user.id },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const pauseIsActive = isPauseActive(limits?.pauseUntil);

  return (
    <AppLayout
      pageTitle="Apuestas"
      userName={user.name || user.email}
      planLabel={getPlanLabel(historyAccess.plan)}
      plan={historyAccess.plan}
    >
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="surface-panel p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                Historial
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">Historial de control</h1>
                {!historyAccess.allowed && <StatusBadge kind="premium" label="Historial completo Premium" />}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Registros privados con filtros, detalle y exportación. La información es histórica y preventiva.
              </p>
              {!historyAccess.allowed && (
                <p className="mt-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning-foreground">
                  En Free, el historial se limita a los últimos 90 días. Premium permite revisar todo el histórico.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/reports/export"
                className="inline-flex items-center justify-center rounded-xl border border-border-strong px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-background"
              >
                Exportar CSV
              </a>
              <Link
                href={advancedExportAccess.allowed ? "/reports/export" : "/upgrade"}
                className={`inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  advancedExportAccess.allowed
                    ? "border border-border-strong text-foreground hover:bg-background"
                    : "bg-accent text-accent-foreground"
                }`}
              >
                {advancedExportAccess.allowed ? "Exportación avanzada" : "Exportación avanzada"}
                {!advancedExportAccess.allowed && <span className="ml-2"><StatusBadge kind="premium" /></span>}
              </Link>
              <Link
                href={pauseIsActive ? "/limits" : "/bets/new"}
                className={`inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  pauseIsActive
                    ? "bg-warning-soft text-warning-foreground"
                    : "bg-primary text-white hover:bg-primary-hover"
                }`}
              >
                {pauseIsActive ? "Pausa activa" : "Nuevo registro"}
              </Link>
            </div>
          </div>
        </div>

        <div className="form-panel p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-foreground">Filtrar historial</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajusta fechas y campos para revisar patrones concretos sin mezclar períodos.
            </p>
          </div>
          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label htmlFor="from" className="text-sm font-medium text-foreground">
                Fecha desde
              </label>
              <input
                id="from"
                name="from"
                type="date"
                defaultValue={resolvedSearchParams.from ?? ""}
                className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="to" className="text-sm font-medium text-foreground">
                Fecha hasta
              </label>
              <input
                id="to"
                name="to"
                type="date"
                defaultValue={resolvedSearchParams.to ?? ""}
                className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="sportsbook" className="text-sm font-medium text-foreground">
                Sportsbook
              </label>
              <input
                id="sportsbook"
                name="sportsbook"
                defaultValue={resolvedSearchParams.sportsbook ?? ""}
                className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="sport" className="text-sm font-medium text-foreground">
                Deporte
              </label>
              <input
                id="sport"
                name="sport"
                defaultValue={resolvedSearchParams.sport ?? ""}
                className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="market" className="text-sm font-medium text-foreground">
                Mercado
              </label>
              <input
                id="market"
                name="market"
                defaultValue={resolvedSearchParams.market ?? ""}
                className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="result" className="text-sm font-medium text-foreground">
                Resultado
              </label>
              <select
                id="result"
                name="result"
                defaultValue={resolvedSearchParams.result ?? ""}
                className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground"
              >
                <option value="">Todos</option>
                {Object.values(BetResult).map((result) => (
                  <option key={result} value={result}>
                    {result}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="minStake" className="text-sm font-medium text-foreground">
                Stake mínimo
              </label>
              <input
                id="minStake"
                name="minStake"
                type="number"
                step="0.01"
                defaultValue={resolvedSearchParams.minStake ?? ""}
                className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="maxStake" className="text-sm font-medium text-foreground">
                Stake máximo
              </label>
              <input
                id="maxStake"
                name="maxStake"
                type="number"
                step="0.01"
                defaultValue={resolvedSearchParams.maxStake ?? ""}
                className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="minOdds" className="text-sm font-medium text-foreground">
                Cuota mínima
              </label>
              <input
                id="minOdds"
                name="minOdds"
                type="number"
                step="0.01"
                defaultValue={resolvedSearchParams.minOdds ?? ""}
                className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="maxOdds" className="text-sm font-medium text-foreground">
                Cuota máxima
              </label>
              <input
                id="maxOdds"
                name="maxOdds"
                type="number"
                step="0.01"
                defaultValue={resolvedSearchParams.maxOdds ?? ""}
                className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground"
              />
            </div>

            <div className="flex items-end gap-3 md:col-span-2 xl:col-span-4">
              <button
                type="submit"
                className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
              >
                Aplicar filtros
              </button>
              <Link
                href="/bets"
                className="rounded-xl border border-border-strong px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-background"
              >
                Limpiar
              </Link>
            </div>
          </form>
        </div>

        <div className="surface-panel overflow-hidden">
          {bets.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Sin registros con estos filtros"
                description="Prueba ampliar el rango de fechas o limpiar filtros para revisar tu historial completo disponible."
                action={
                <Link
                  href="/bets/new"
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
                >
                  Crear registro manual
                </Link>
                }
              />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="data-table">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Evento</th>
                      <th className="px-4 py-3">Casa</th>
                      <th className="px-4 py-3">Mercado</th>
                      <th className="px-4 py-3">Stake</th>
                      <th className="px-4 py-3">Cuota</th>
                      <th className="px-4 py-3">Resultado</th>
                      <th className="px-4 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted">
                    {bets.map((bet) => (
                      <tr key={bet.id}>
                        <td className="px-4 py-3 text-text-secondary">
                          {bet.placedAt ? new Intl.DateTimeFormat("es-CL", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(bet.placedAt) : "Sin fecha registrada"}
                        </td>
                        <td className="px-4 py-3 text-foreground">{bet.title}</td>
                        <td className="px-4 py-3 text-text-secondary">{bet.sportsbook || "—"}</td>
                        <td className="px-4 py-3 text-text-secondary">{bet.market || "—"}</td>
                        <td className="px-4 py-3 text-text-secondary">
                          {bet.currency} {bet.stake.toString()}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{formatOdds(Number(bet.odds), user.oddsFormat)}</td>
                        <td className="px-4 py-3 text-text-secondary">
                          <QuickBetResultSelect betId={bet.id} result={bet.result} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/bets/${bet.id}`}
                              className="rounded-xl border border-border-strong px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-background"
                            >
                              Ver detalle
                            </Link>
                            <Link
                              href={`/bets/${bet.id}/edit`}
                              className="rounded-xl border border-border-strong px-3 py-2 text-sm font-semibold text-primary transition hover:bg-accent"
                            >
                              Editar
                            </Link>
                            <DeleteBetButton betId={bet.id} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 p-4 lg:hidden">
                {bets.map((bet) => (
                  <article
                    key={bet.id}
                    className="rounded-2xl border border-border bg-background/50 p-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-sm font-semibold text-foreground">{bet.title}</h2>
                        <QuickBetResultSelect betId={bet.id} result={bet.result} compact />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {bet.placedAt ? new Intl.DateTimeFormat("es-CL", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(bet.placedAt) : "Sin fecha registrada"}
                      </p>
                      <dl className="grid grid-cols-2 gap-2 text-sm text-text-secondary">
                        <div>
                          <dt className="text-xs uppercase tracking-wider text-soft">Casa</dt>
                          <dd>{bet.sportsbook || "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wider text-soft">Mercado</dt>
                          <dd>{bet.market || "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wider text-soft">Stake</dt>
                          <dd>
                            {bet.currency} {bet.stake.toString()}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wider text-soft">Cuota</dt>
                          <dd>{formatOdds(Number(bet.odds), user.oddsFormat)}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/bets/${bet.id}`}
                        className="rounded-xl border border-border-strong px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-background"
                      >
                        Ver detalle
                      </Link>
                      <Link
                        href={`/bets/${bet.id}/edit`}
                        className="rounded-xl border border-border-strong px-3 py-2 text-sm font-semibold text-primary transition hover:bg-accent"
                      >
                        Editar
                      </Link>
                      <DeleteBetButton betId={bet.id} />
                    </div>
                  </article>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-border px-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Link
                    href={hasPreviousPage ? buildPageHref(resolvedSearchParams, currentPage - 1) : "#"}
                    aria-disabled={!hasPreviousPage}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      hasPreviousPage
                        ? "border border-border-strong text-foreground hover:bg-background"
                        : "cursor-not-allowed border border-border text-soft"
                    }`}
                  >
                    Anterior
                  </Link>
                  <Link
                    href={hasNextPage ? buildPageHref(resolvedSearchParams, currentPage + 1) : "#"}
                    aria-disabled={!hasNextPage}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      hasNextPage
                        ? "border border-border-strong text-foreground hover:bg-background"
                        : "cursor-not-allowed border border-border text-soft"
                    }`}
                  >
                    Siguiente
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </AppLayout>
  );
}
