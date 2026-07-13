import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { isOnboardingComplete, requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const user = await requireUser({ allowIncompleteOnboarding: true });

  if (isOnboardingComplete(user)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(20,184,166,0.10),transparent_30%)]" />
      <div className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="surface-panel p-7 lg:sticky lg:top-8 lg:self-start">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">
            Primer setup
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-foreground">
            Deja StakeControl listo antes de registrar tu primera apuesta.
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Esto no es un tipster ni una app para buscar picks. Es tu bitácora privada para mirar stakes, cuotas,
            mercados, límites y rachas con distancia.
          </p>
          <div className="mt-6 space-y-3">
            {[
              "Define límites iniciales para tener referencias desde el día uno.",
              "Marca tus deportes principales para que el producto se sienta tuyo.",
              "Confirma reglas de uso responsable antes de entrar al dashboard.",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-border bg-background/70 p-4 text-sm text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
        </aside>

        <main className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <OnboardingForm
            email={user.email}
            currency={user.currency}
            ageConfirmed={user.ageConfirmed}
            termsAccepted={Boolean(user.termsAcceptedAt)}
          />
        </main>
      </div>
    </div>
  );
}
