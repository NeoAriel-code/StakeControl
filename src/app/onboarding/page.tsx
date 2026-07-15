import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { isOnboardingComplete, requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const user = await requireUser({ allowIncompleteOnboarding: true });

  if (isOnboardingComplete(user)) {
    redirect("/dashboard");
  }

  return (
    <div className="auth-stage overflow-hidden">
      <div className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="auth-panel p-7 lg:sticky lg:top-8 lg:self-start">
          <p className="auth-kicker">Paso 02 · Primer setup</p>
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
              <div key={item} className="border-l-2 border-primary/40 bg-background/70 p-4 text-sm text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
        </aside>

        <main className="auth-panel p-6 sm:p-8">
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
