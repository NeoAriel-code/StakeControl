import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Términos | StakeControl",
  description: "Términos básicos de uso para el MVP de StakeControl.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <FileText size={24} className="mt-1 text-primary" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                StakeControl
              </p>
              <h1 className="mt-2 text-3xl font-bold">Términos de uso</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Estos términos aplican al MVP de StakeControl como herramienta de registro, análisis histórico y
                autocontrol.
              </p>
            </div>
          </div>
        </div>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Uso responsable</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            StakeControl no recomienda apuestas, mercados, selecciones ni aumentos de stake. La información mostrada
            se basa en datos históricos y puede estar influida por muestra pequeña o varianza.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Sin promesas de rendimiento</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            El rendimiento pasado no garantiza resultados futuros. Los reportes, alertas y métricas tienen finalidad
            preventiva y de autocontrol.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Cuentas externas</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            El MVP no conecta cuentas de sportsbooks, no solicita credenciales de casas de apuesta y no ejecuta
            operaciones externas de apuesta.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Responsabilidad del usuario</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            El usuario es responsable de la veracidad de los datos que registra y de revisar sus propios límites. Si
            notas pérdida de control, considera pausar temporalmente y buscar apoyo profesional o recursos locales.
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/privacy" className="rounded-xl border border-border-strong px-4 py-3 text-sm font-semibold">
            Ver privacidad
          </Link>
          <Link href="/dashboard" className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
            Volver a StakeControl
          </Link>
        </div>
      </section>
    </main>
  );
}
