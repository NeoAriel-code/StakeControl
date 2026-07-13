import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacidad | StakeControl",
  description: "Política básica de privacidad para el MVP de StakeControl.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck size={24} className="mt-1 text-primary" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                StakeControl
              </p>
              <h1 className="mt-2 text-3xl font-bold">Política de privacidad</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Esta política describe cómo el MVP trata datos personales, tickets e información financiera registrada
                por el usuario para fines de autocontrol.
              </p>
            </div>
          </div>
        </div>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Datos que guardamos</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Guardamos email, nombre opcional, confirmaciones de onboarding, límites configurados, apuestas registradas,
            tickets cargados, resultados de OCR, reportes mensuales y alertas de juego responsable.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Datos que no guardamos</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            No guardamos credenciales de casas de apuesta, no conectamos cuentas de sportsbooks y no solicitamos acceso
            a cuentas externas de apuestas.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Uso de tickets e historial</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Las imágenes de tickets se tratan como privadas y se asocian al usuario autenticado. El historial se usa
            para métricas, reportes y alertas preventivas. StakeControl no vende ni comparte estos datos en el MVP.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Eliminación de cuenta</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Desde el perfil puedes eliminar tu cuenta. Esto borra apuestas, tickets, reportes, alertas, límites,
            suscripciones locales y archivos privados asociados.
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/terms" className="rounded-xl border border-border-strong px-4 py-3 text-sm font-semibold">
            Ver términos
          </Link>
          <Link href="/dashboard" className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
            Volver a StakeControl
          </Link>
        </div>
      </section>
    </main>
  );
}
