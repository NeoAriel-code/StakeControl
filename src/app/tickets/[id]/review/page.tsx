import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileImage, FileText, ScanSearch } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { TicketReviewForm } from "@/components/tickets/TicketReviewForm";
import { requireUser } from "@/lib/auth";
import { getPlanLabel, getUserPlan } from "@/lib/plans";
import prisma from "@/lib/prisma";
import { extractedBetTicketSchema } from "@/lib/ticket-extraction";

export const metadata: Metadata = {
  title: "Revisión de ticket | StakeControl",
  description: "Pantalla intermedia de revisión y preparación para OCR antes de crear una apuesta.",
};

type TicketReviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TicketReviewPage({ params }: TicketReviewPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const plan = await getUserPlan(user.id);

  const ticketImage = await prisma.betTicketImage.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      aiExtraction: true,
    },
  });

  if (!ticketImage) {
    notFound();
  }

  if (!ticketImage.aiExtraction?.rawText || !ticketImage.aiExtraction.extractedData) {
    notFound();
  }

  const fileUrl = `/api/tickets/${ticketImage.id}/file`;
  const isPdf = ticketImage.mimeType === "application/pdf";
  const extractedBet = extractedBetTicketSchema.parse(ticketImage.aiExtraction.extractedData);
  const requiresReview = extractedBet.confidenceScore < 0.85;
  const processingDescription =
    "El texto del ticket fue extraído automáticamente. Revisa los campos antes de crear la apuesta final.";

  return (
    <AppLayout
      pageTitle="Revisión de ticket"
      userName={user.name || user.email}
      planLabel={getPlanLabel(plan)}
      plan={plan}
    >
      <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Revisión de ticket"
          description="El archivo ya quedó asociado a tu cuenta. Todavía no se creó ninguna apuesta."
          icon={ScanSearch}
          breadcrumb="StakeControl"
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              {isPdf ? <FileText size={18} className="text-primary" /> : <FileImage size={18} className="text-primary" />}
              <div>
                <h2 className="text-lg font-semibold text-foreground">{ticketImage.fileName || "Ticket subido"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Recurso privado asociado a tu usuario. Disponible solo tras autenticación.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-background p-2">
              {isPdf ? (
                <div className="flex min-h-48 items-center justify-center p-6 text-center">
                  <a href={fileUrl} className="rounded-xl border border-border-strong px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-card">
                    Descargar PDF de forma segura
                  </a>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fileUrl}
                  alt={ticketImage.fileName || "Vista previa del ticket"}
                  className="h-auto max-h-[720px] w-full rounded-xl object-contain"
                />
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Estado de procesamiento</h2>
              <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                <p className="text-sm font-semibold text-foreground">
                  {requiresReview ? "Revisión obligatoria" : "Lista para confirmación manual"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {processingDescription}
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Texto OCR detectado</h2>
              <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {ticketImage.aiExtraction.rawText}
                </pre>
              </div>
            </section>
          </aside>
        </div>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Campos detectados</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Corrige cualquier valor necesario. Nunca se guarda una apuesta OCR sin revisión humana.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/tickets/upload"
                className="rounded-xl border border-border-strong px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-background"
              >
                Subir otro ticket
              </Link>
              <Link
                href="/tickets"
                className="rounded-xl border border-border-strong px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-background"
              >
                Volver a tickets
              </Link>
            </div>
          </div>

          <TicketReviewForm
            ticketId={ticketImage.id}
            extractedBet={extractedBet}
            requiresReview={requiresReview}
          />
        </section>
      </section>
    </AppLayout>
  );
}
