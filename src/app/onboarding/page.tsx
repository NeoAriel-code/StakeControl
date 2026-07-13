import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { isOnboardingComplete, requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const user = await requireUser({ allowIncompleteOnboarding: true });

  if (isOnboardingComplete(user)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            Onboarding obligatorio
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Antes de continuar</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            StakeControl es una herramienta de registro y autocontrol. No entrega predicciones ni promesas de rentabilidad.
          </p>
        </div>

        <OnboardingForm
          email={user.email}
          ageConfirmed={user.ageConfirmed}
          termsAccepted={Boolean(user.termsAcceptedAt)}
        />
      </div>
    </div>
  );
}
