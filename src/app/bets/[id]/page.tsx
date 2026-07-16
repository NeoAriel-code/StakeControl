import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { DeleteBetButton } from "@/components/bets/DeleteBetButton";
import { requireUser } from "@/lib/auth";
import { canUseFeature, getHistoryCutoffDate, getPlanLabel, getUserPlan } from "@/lib/plans";
import prisma from "@/lib/prisma";
import { isPrivateStorageReference } from "@/lib/storage";
import { formatOdds } from "@/lib/odds-format";
import { getHistoricalProfitLoss } from "@/lib/bet-outcomes";
import { BET_RESULT_LABELS, BET_TYPE_LABELS } from "@/lib/bet-enums";

type BetDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BetDetailPage({ params }: BetDetailPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const [hasFullHistory, plan] = await Promise.all([
    canUseFeature(user.id, "history_full"),
    getUserPlan(user.id),
  ]);

  const bet = await prisma.bet.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      legs: {
        orderBy: { position: "asc" },
      },
      ticketImages: {
        orderBy: { uploadedAt: "desc" },
      },
    },
  });

  if (!bet) {
    notFound();
  }

  if (!hasFullHistory && bet.placedAt && bet.placedAt < getHistoryCutoffDate()) {
    redirect("/upgrade");
  }

  return (
    <AppLayout
      pageTitle="Detalle de apuesta"
      userName={user.name || user.email}
      planLabel={getPlanLabel(plan)}
      plan={plan}
    >
      <section className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                Registro histórico
              </p>
              <h1 className="mt-2 text-3xl font-bold text-foreground">{bet.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Este registro es histórico y se conserva para control personal y trazabilidad.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/bets/${bet.id}/edit`}
                className="rounded-xl border border-border-strong px-4 py-3 text-sm font-semibold text-primary transition hover:bg-accent"
              >
                Editar
              </Link>
              <DeleteBetButton betId={bet.id} />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Fecha y hora</dt>
                <dd className="mt-1 text-sm text-foreground">
                  {bet.placedAt ? new Intl.DateTimeFormat("es-CL", {
                    dateStyle: "full",
                    timeStyle: "short",
                  }).format(bet.placedAt) : "Sin fecha registrada"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Sportsbook</dt>
                <dd className="mt-1 text-sm text-foreground">{bet.sportsbook || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Deporte</dt>
                <dd className="mt-1 text-sm text-foreground">{bet.sport || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Liga</dt>
                <dd className="mt-1 text-sm text-foreground">{bet.league || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Mercado</dt>
                <dd className="mt-1 text-sm text-foreground">{bet.market || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Selección</dt>
                <dd className="mt-1 text-sm text-foreground">{bet.selection || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tipo de apuesta</dt>
                <dd className="mt-1 text-sm text-foreground">{BET_TYPE_LABELS[bet.betType]}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Resultado</dt>
                <dd className="mt-1 text-sm text-foreground">{BET_RESULT_LABELS[bet.result]}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Descripción</dt>
                <dd className="mt-1 text-sm text-foreground">{bet.description || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Stake</dt>
                <dd className="mt-1 text-sm text-foreground">
                  {bet.currency} {bet.stake.toString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cuota</dt>
                <dd className="mt-1 text-sm text-foreground">{formatOdds(Number(bet.odds), user.oddsFormat)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Posible retorno</dt>
                <dd className="mt-1 text-sm text-foreground">
                  {bet.potentialPayout ? `${bet.currency} ${bet.potentialPayout.toString()}` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Ganancia / pérdida neta</dt>
                <dd className="mt-1 text-sm text-foreground">
                  {`${bet.currency} ${getHistoricalProfitLoss(bet.result, Number(bet.stake), bet.profitLoss ? Number(bet.profitLoss) : 0)}`}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Código de ticket</dt>
                <dd className="mt-1 text-sm text-foreground">{bet.ticketCode || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Retorno liquidado</dt>
                <dd className="mt-1 text-sm text-foreground">
                  {bet.settledPayout ? `${bet.currency} ${bet.settledPayout.toString()}` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Fecha liquidación</dt>
                <dd className="mt-1 text-sm text-foreground">
                  {bet.settledAt
                    ? new Intl.DateTimeFormat("es-CL", {
                        dateStyle: "full",
                        timeStyle: "short",
                      }).format(bet.settledAt)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Creado</dt>
                <dd className="mt-1 text-sm text-foreground">
                  {new Intl.DateTimeFormat("es-CL", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(bet.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Actualizado</dt>
                <dd className="mt-1 text-sm text-foreground">
                  {new Intl.DateTimeFormat("es-CL", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(bet.updatedAt)}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Notas</dt>
                <dd className="mt-1 text-sm text-foreground whitespace-pre-wrap">{bet.notes || "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Ticket asociado</h2>
            {bet.ticketImages.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No hay imagen de ticket asociada a esta apuesta.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {bet.ticketImages.map((ticketImage) => (
                  <div key={ticketImage.id} className="space-y-2">
                    <div className="rounded-2xl border border-border bg-background p-2">
                      {ticketImage.mimeType === "application/pdf" ? (
                        <iframe
                          src={
                            isPrivateStorageReference(ticketImage.imageUrl)
                              ? `/api/tickets/${ticketImage.id}/file`
                              : ticketImage.imageUrl
                          }
                          title={ticketImage.fileName || "Ticket asociado"}
                          className="h-[420px] w-full rounded-xl"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            isPrivateStorageReference(ticketImage.imageUrl)
                              ? `/api/tickets/${ticketImage.id}/file`
                              : ticketImage.imageUrl
                          }
                          alt={ticketImage.fileName || "Ticket asociado"}
                          className="h-auto w-full rounded-xl object-cover"
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ticketImage.fileName || "Imagen sin nombre"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Selecciones del ticket</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Detalle histórico de las selecciones que componen esta apuesta.
            </p>
          </div>
          {bet.legs.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Este registro fue creado antes del detalle por selección. Consulta los datos generales arriba.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 font-semibold">#</th>
                    <th className="px-3 py-3 font-semibold">Evento</th>
                    <th className="px-3 py-3 font-semibold">Mercado</th>
                    <th className="px-3 py-3 font-semibold">Selección</th>
                    <th className="px-3 py-3 font-semibold">Cuota</th>
                    <th className="px-3 py-3 font-semibold">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {bet.legs.map((leg) => (
                    <tr key={leg.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-3 text-muted-foreground">{leg.position + 1}</td>
                      <td className="px-3 py-3 text-foreground">
                        <p>{leg.event}</p>
                        {(leg.sport || leg.league) && (
                          <p className="mt-1 text-xs text-muted-foreground">{[leg.sport, leg.league].filter(Boolean).join(" · ")}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-foreground">{leg.market || "—"}</td>
                      <td className="px-3 py-3 text-foreground">{leg.selection || "—"}</td>
                      <td className="px-3 py-3 text-foreground">
                        {leg.odds ? formatOdds(Number(leg.odds), user.oddsFormat) : "—"}
                      </td>
                      <td className="px-3 py-3 text-foreground">{BET_RESULT_LABELS[leg.result]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </AppLayout>
  );
}
