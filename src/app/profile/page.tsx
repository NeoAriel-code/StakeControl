import { AppLayout } from "@/components/layout/AppLayout";
import { DeleteAccountForm } from "@/components/auth/DeleteAccountForm";
import { logoutAction } from "@/lib/auth-actions";
import { requireUser } from "@/lib/auth";
import { getMonthlyOcrTicketUsage, getPlanLabel, getUserPlan } from "@/lib/plans";
import { getCountryName } from "@/lib/countries";
import { parsePreferredSports } from "@/lib/sports";
import Link from "next/link";

export default async function ProfilePage() {
  const user = await requireUser();
  const [plan, monthlyOcrUsage] = await Promise.all([
    getUserPlan(user.id),
    getMonthlyOcrTicketUsage(user.id),
  ]);
  const preferredSports = parsePreferredSports(user.preferredSports);

  return (
    <AppLayout
      pageTitle="Perfil"
      userName={user.name || user.email}
      planLabel={getPlanLabel(plan)}
      plan={plan}
    >
      <section className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            Mi cuenta
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Perfil</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Información de tu cuenta y preferencias actuales.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Nombre
              </dt>
              <dd className="mt-1 text-sm text-foreground">{user.name || "No definido"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Email
              </dt>
              <dd className="mt-1 text-sm text-foreground">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                País
              </dt>
              <dd className="mt-1 text-sm text-foreground">{getCountryName(user.country)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Moneda principal
              </dt>
              <dd className="mt-1 text-sm text-foreground">{user.currency}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Deportes principales
              </dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {preferredSports.length > 0 ? (
                  preferredSports.map((sport) => (
                    <span
                      key={sport}
                      className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground"
                    >
                      {sport}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-foreground">No definidos</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Mayor de edad
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {user.ageConfirmed ? "Confirmado" : "Pendiente"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Configuración inicial
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {user.onboardingCompletedAt ? "Completo" : "Pendiente"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Plan actual
              </dt>
              <dd className="mt-1 text-sm text-foreground">{plan === "PREMIUM" ? "Premium" : "Free"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Tickets OCR del mes
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {monthlyOcrUsage} / {plan === "PREMIUM" ? 250 : 10}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-background"
            >
              Cerrar sesión
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Documentos legales</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Consulta los términos de uso y la política de privacidad de StakeControl.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/terms"
              className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-background"
            >
              Términos
            </Link>
            <Link
              href="/privacy"
              className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-background"
            >
              Privacidad
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-danger-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-danger">
            Zona de riesgo
          </p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">Eliminar cuenta</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Esta acción elimina tu usuario, apuestas, tickets, reportes, alertas y archivos privados asociados.
            No se puede deshacer.
          </p>
          <DeleteAccountForm />
        </div>
      </section>
    </AppLayout>
  );
}
