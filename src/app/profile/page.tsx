import { AppLayout } from "@/components/layout/AppLayout";
import { logoutAction } from "@/lib/auth-actions";
import { requireUser } from "@/lib/auth";
import { getMonthlyOcrTicketUsage, getPlanLabel, getUserPlan } from "@/lib/plans";

export default async function ProfilePage() {
  const user = await requireUser();
  const [plan, monthlyOcrUsage] = await Promise.all([
    getUserPlan(user.id),
    getMonthlyOcrTicketUsage(user.id),
  ]);

  return (
    <AppLayout
      pageTitle="Perfil"
      userName={user.name || user.email}
      planLabel={getPlanLabel(plan)}
    >
      <section className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            Mi cuenta
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Perfil</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Resumen básico del acceso y del estado de onboarding.
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
                Mayor de edad
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {user.ageConfirmed ? "Confirmado" : "Pendiente"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Onboarding
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
      </section>
    </AppLayout>
  );
}
