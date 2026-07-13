import type { Metadata } from "next";
import Link from "next/link";
import { Check, Crown, ShieldAlert } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireUser } from "@/lib/auth";
import { getPlanLabel, getUserPlan } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Upgrade | StakeControl",
  description: "Comparación entre el plan Free y Premium para habilitar funciones avanzadas sin pago obligatorio todavía.",
};

const FREE_FEATURES = [
  "Registro manual ilimitado",
  "10 tickets OCR al mes",
  "Dashboard básico",
  "Historial de últimos 90 días",
  "Alertas simples",
  "Exportación CSV básica",
];

const PREMIUM_FEATURES = [
  "Más tickets OCR al mes",
  "Historial completo",
  "Análisis IA responsable",
  "Segmentación avanzada",
  "Informe mensual",
  "Exportación avanzada",
  "Alertas inteligentes",
];

export default async function UpgradePage() {
  const user = await requireUser();
  const plan = await getUserPlan(user.id);

  return (
    <AppLayout pageTitle="Upgrade" userName={user.name || user.email} planLabel={getPlanLabel(plan)}>
      <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Planes StakeControl"
          description="El gating ya está activo. Puedes mantener Free para el MVP o preparar el salto a Premium más adelante."
          icon={Crown}
          breadcrumb="StakeControl"
        />

        <div className="rounded-3xl border border-warning/30 bg-warning-soft p-5 text-sm text-warning-foreground shadow-sm">
          No hay pago real obligatorio todavía. Esta pantalla prepara el gating funcional para el MVP.
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Free</p>
                <h2 className="mt-2 text-2xl font-bold text-foreground">Plan actual base</h2>
              </div>
              {plan === "FREE" && (
                <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                  Tu plan actual
                </span>
              )}
            </div>
            <ul className="mt-6 space-y-3">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                  <Check size={16} className="mt-0.5 text-success" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-primary/20 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Premium</p>
                <h2 className="mt-2 text-2xl font-bold text-foreground">Funciones avanzadas</h2>
              </div>
              {plan === "PREMIUM" ? (
                <span className="rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-semibold text-primary">
                  Ya activo
                </span>
              ) : (
                <span className="rounded-full border border-warning/30 bg-warning-soft px-3 py-1 text-xs font-semibold text-warning-foreground">
                  Próxima activación
                </span>
              )}
            </div>
            <ul className="mt-6 space-y-3">
              {PREMIUM_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                  <Check size={16} className="mt-0.5 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {plan !== "PREMIUM" && (
              <div className="mt-6 rounded-2xl border border-border bg-background p-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert size={18} className="mt-0.5 text-warning" />
                  <p className="text-sm text-muted-foreground">
                    Cuando definas la activación comercial, bastará con cambiar la suscripción activa del usuario.
                    La UI y el gating ya están preparados.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl border border-border-strong px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-background"
          >
            Volver al dashboard
          </Link>
        </div>
      </section>
    </AppLayout>
  );
}
