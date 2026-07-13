import type { Metadata } from "next";
import Link from "next/link";
import { Ticket, Upload, PauseCircle, ScanSearch } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getFeatureAccess, getPlanLabel } from "@/lib/plans";
import { formatPauseMessage, isPauseActive } from "@/lib/responsible-gaming";

export const metadata: Metadata = {
  title: "Tickets | StakeControl",
  description: "Carga de tickets y control responsable sobre registros asistidos.",
};

export default async function TicketsPage() {
  const user = await requireUser();
  const [limits, recentTickets, ocrAccess, plan] = await Promise.all([
    prisma.userLimits.findUnique({
      where: { userId: user.id },
    }),
    prisma.betTicketImage.findMany({
      where: { userId: user.id },
      orderBy: { uploadedAt: "desc" },
      take: 8,
      include: {
        aiExtraction: true,
      },
    }),
    getFeatureAccess(user.id, "ocr_tickets"),
    getFeatureAccess(user.id, "manual_bet_registration").then((access) => access.plan),
  ]);

  const pauseIsActive = isPauseActive(limits?.pauseUntil);

  return (
    <AppLayout
      pageTitle="Cargar ticket"
      userName={user.name || user.email}
      planLabel={getPlanLabel(plan)}
      plan={plan}
    >
      <section className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Carga de tickets"
          description="Carga tickets de forma privada para revisión y procesamiento posterior, sin crear apuestas automáticamente."
          icon={Ticket}
          breadcrumb="StakeControl"
          actions={
            !pauseIsActive && ocrAccess.allowed ? (
              <Link
                href="/tickets/upload"
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                <Upload size={15} />
                Subir ticket
              </Link>
            ) : undefined
          }
        />

        {pauseIsActive ? (
          <div className="rounded-3xl border border-warning/30 bg-warning-soft p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <PauseCircle size={18} className="mt-0.5 text-warning" />
              <div>
                <h2 className="text-lg font-semibold text-warning-foreground">Carga bloqueada por pausa voluntaria</h2>
                <p className="mt-2 text-sm text-warning-foreground">{formatPauseMessage(limits!.pauseUntil!)}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Tickets OCR usados este mes</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {ocrAccess.used ?? 0} de {ocrAccess.limit ?? "∞"} disponibles.
                  </p>
                </div>
                {!ocrAccess.allowed && (
                  <Link
                    href="/upgrade"
                    className="inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
                  >
                    Mejorar a Premium
                  </Link>
                )}
              </div>
              {!ocrAccess.allowed && ocrAccess.upgradeMessage && (
                <p className="mt-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning-foreground">
                  {ocrAccess.upgradeMessage}
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <Upload size={18} className="mt-0.5 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Carga privada y revisión</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    El ticket se asocia a tu usuario y se envía a revisión/OCR antes de generar cualquier apuesta.
                  </p>
                  <div className="mt-4">
                    <Link
                      href={ocrAccess.allowed ? "/tickets/upload" : "/upgrade"}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                        ocrAccess.allowed
                          ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                          : "border border-border-strong text-foreground hover:bg-background"
                      }`}
                    >
                      <Upload size={15} />
                      {ocrAccess.allowed ? "Ir a subir ticket" : "Ver planes"}
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-foreground">Tickets recientes</h2>
                <p className="text-sm text-muted-foreground">
                  No se crea ninguna apuesta hasta revisar OCR o completar datos manualmente.
                </p>
              </div>

              {recentTickets.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Aún no has subido tickets para revisión.
                </p>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {recentTickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/tickets/${ticket.id}/review`}
                      className="rounded-2xl border border-border bg-background p-4 transition hover:bg-accent/40"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-primary">
                          <ScanSearch size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {ticket.fileName || "Ticket sin nombre"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {ticket.mimeType || "Archivo"} · {ticket.aiExtraction?.status || "pending_review"}
                          </p>
                          <p className="mt-2 text-xs text-soft">
                            {new Intl.DateTimeFormat("es-CL", {
                              dateStyle: "short",
                              timeStyle: "short",
                            }).format(ticket.uploadedAt)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </AppLayout>
  );
}
