"use client";

import { useActionState } from "react";
import { completeOnboardingAction, type AuthActionState } from "@/lib/auth-actions";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: AuthActionState = {};

type OnboardingFormProps = {
  email: string;
};

function OnboardingCheckbox({
  id,
  name,
  children,
}: {
  id: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3 rounded-2xl border border-border bg-background px-4 py-4 text-sm text-text-secondary"
    >
      <input
        id={id}
        name={name}
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-border-strong text-primary focus:ring-primary"
      />
      <span>{children}</span>
    </label>
  );
}

export function OnboardingForm({ email }: OnboardingFormProps) {
  const [state, action] = useActionState(completeOnboardingAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="rounded-2xl border border-primary/20 bg-accent px-4 py-4 text-sm text-primary">
        Estás ingresando como <span className="font-semibold">{email}</span>. Antes de usar StakeControl debes completar estas confirmaciones.
      </div>

      <OnboardingCheckbox id="ageConfirmed" name="ageConfirmed">
        Confirmo que soy mayor de 18 años.
      </OnboardingCheckbox>

      <OnboardingCheckbox
        id="platformDisclaimerAccepted"
        name="platformDisclaimerAccepted"
      >
        Entiendo que StakeControl no recomienda apuestas.
      </OnboardingCheckbox>

      <OnboardingCheckbox
        id="performanceDisclaimerAccepted"
        name="performanceDisclaimerAccepted"
      >
        Entiendo que el rendimiento pasado no garantiza resultados futuros.
      </OnboardingCheckbox>

      <OnboardingCheckbox id="termsAccepted" name="termsAccepted">
        Acepto términos y política de privacidad.
      </OnboardingCheckbox>

      {state.error && (
        <p className="rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <SubmitButton idleLabel="Completar onboarding" pendingLabel="Guardando..." />
    </form>
  );
}
