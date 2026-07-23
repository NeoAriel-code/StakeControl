import { BetaTermsForm } from "@/components/auth/BetaTermsForm";
import { isOnboardingComplete, requireUser } from "@/lib/auth";
import { hasAcceptedCurrentBetaTerms } from "@/lib/beta-terms";
import { redirect } from "next/navigation";

export default async function BetaTermsPage() {
  const user = await requireUser({ allowUnacceptedBetaTerms: true });
  if (!isOnboardingComplete(user)) redirect("/onboarding");
  if (hasAcceptedCurrentBetaTerms(user)) redirect("/dashboard");

  return (
    <div className="auth-stage flex items-center justify-center">
      <main className="auth-panel w-full max-w-2xl p-7 sm:p-9">
        <p className="auth-kicker">Acceso beta</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Antes de continuar</h1>
        <p className="mt-2 text-sm text-muted-foreground">Queremos que sepas exactamente qué esperar durante este período de prueba.</p>
        <div className="mt-7"><BetaTermsForm /></div>
      </main>
    </div>
  );
}
