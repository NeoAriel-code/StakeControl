import type { Metadata } from "next";
import Link from "next/link";
import { PauseCircle, Ticket } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { TicketUploadForm } from "@/components/tickets/TicketUploadForm";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getFeatureAccess, getPlanLabel } from "@/lib/plans";
import { formatPauseMessage, isPauseActive } from "@/lib/responsible-gaming";

export const metadata: Metadata = {
  title: "Subir ticket | StakeControl",
  description: "Carga privada de tickets para revisión y OCR posterior, sin crear apuestas automáticamente.",
};

export default async function TicketUploadPage() {
  const user = await requireUser();
  const [limits, ocrAccess, plan] = await Promise.all([
    prisma.userLimits.findUnique({
      where: { userId: user.id },
    }),
    getFeatureAccess(user.id, "ocr_tickets"),
    getFeatureAccess(user.id, "manual_bet_registration").then((access) => access.plan),
  ]);
  const pauseIsActive = isPauseActive(limits?.pauseUntil);

  return (
    <AppLayout
      pageTitle="Subir ticket"
      userName={user.name || user.email}
      planLabel={getPlanLabel(plan)}
    >
      <section className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Subir ticket"
          description="Carga un comprobante de apuesta para revisión posterior. Esta acción no crea una apuesta todavía."
          icon={Ticket}
          breadcrumb="StakeControl"
        />

        {pauseIsActive ? (
          <div className="rounded-3xl border border-warning/30 bg-warning-soft p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <PauseCircle size={18} className="mt-0.5 text-warning" />
              <div>
                <h2 className="text-lg font-semibold text-warning-foreground">
                  Carga bloqueada por pausa voluntaria
                </h2>
                <p className="mt-2 text-sm text-warning-foreground">{formatPauseMessage(limits!.pauseUntil!)}</p>
              </div>
            </div>
          </div>
        ) : !ocrAccess.allowed ? (
          <div className="rounded-3xl border border-warning/30 bg-warning-soft p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-warning-foreground">Cupo OCR mensual alcanzado</h2>
            <p className="mt-2 text-sm text-warning-foreground">
              {ocrAccess.upgradeMessage}
            </p>
            <div className="mt-4">
              <Link
                href="/upgrade"
                className="inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
              >
                Ver planes
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <TicketUploadForm />
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Qué ocurre después</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-background p-4">
                  <p className="text-sm font-semibold text-foreground">1. Subida privada</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    El archivo se asocia a tu usuario y queda fuera de exposición pública permanente.
                  </p>
                </div>
                <div className="rounded-2xl bg-background p-4">
                  <p className="text-sm font-semibold text-foreground">2. Revisión / OCR</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Se redirige a una pantalla de procesamiento para revisar el ticket antes de generar cualquier registro.
                  </p>
                </div>
                <div className="rounded-2xl bg-background p-4">
                  <p className="text-sm font-semibold text-foreground">3. Confirmación manual</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    No se crea ninguna apuesta hasta confirmar los datos extraídos o completarlos manualmente.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/tickets"
                  className="inline-flex rounded-xl border border-border-strong px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-background"
                >
                  Volver a tickets
                </Link>
              </div>
            </div>
          </>
        )}
      </section>
    </AppLayout>
  );
}
