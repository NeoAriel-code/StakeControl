"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2, Goal, ShieldCheck, Trophy } from "lucide-react";
import { completeOnboardingAction, type AuthActionState } from "@/lib/auth-actions";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { SPORT_OPTIONS } from "@/lib/sports";

const initialState: AuthActionState = {};

type OnboardingFormProps = {
  email: string;
  currency: string;
  ageConfirmed: boolean;
  termsAccepted: boolean;
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
      className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-background px-4 py-4 text-sm text-muted-foreground transition hover:border-primary/30 hover:bg-accent/50"
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

function OnboardingStep({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-background/55 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-black text-foreground">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function OnboardingForm({ email, currency, ageConfirmed, termsAccepted }: OnboardingFormProps) {
  const [state, action] = useActionState(completeOnboardingAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <div className="rounded-2xl border border-primary/20 bg-accent px-4 py-4 text-sm text-primary">
        Estás ingresando como <span className="font-semibold">{email}</span>. Tu moneda inicial es{" "}
        <span className="font-semibold">{currency}</span>; podrás cambiarla en configuración o por apuesta.
      </div>

      <OnboardingStep
        icon={Trophy}
        eyebrow="Preferencias"
        title="¿Qué deportes registras más?"
        description="Esto ayuda a que el producto hable tu idioma desde el inicio. No se usa para recomendar apuestas."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {SPORT_OPTIONS.map((sport) => (
            <label
              key={sport}
              htmlFor={`sport-${sport}`}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-accent/50"
            >
              <input
                id={`sport-${sport}`}
                name="preferredSports"
                type="checkbox"
                value={sport}
                className="h-4 w-4 rounded border-border-strong text-primary focus:ring-primary"
              />
              {sport}
            </label>
          ))}
        </div>
      </OnboardingStep>

      <OnboardingStep
        icon={Goal}
        eyebrow="Límites iniciales"
        title="Define referencias preventivas"
        description="Puedes dejarlos vacíos y configurarlos después, pero tener límites desde el primer día hace más útil el dashboard."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="weeklyStakeLimit" className="text-sm font-semibold text-foreground">
              Límite semanal
            </label>
            <input
              id="weeklyStakeLimit"
              name="weeklyStakeLimit"
              type="number"
              min="0"
              step="0.01"
              placeholder={currency}
              className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="monthlyStakeLimit" className="text-sm font-semibold text-foreground">
              Límite mensual
            </label>
            <input
              id="monthlyStakeLimit"
              name="monthlyStakeLimit"
              type="number"
              min="0"
              step="0.01"
              placeholder={currency}
              className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="maxStakePerBet" className="text-sm font-semibold text-foreground">
              Stake máximo
            </label>
            <input
              id="maxStakePerBet"
              name="maxStakePerBet"
              type="number"
              min="0"
              step="0.01"
              placeholder={currency}
              className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground"
            />
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          No se recomienda aumentar el stake automáticamente. Estos valores son límites personales, no objetivos de gasto.
        </p>
      </OnboardingStep>

      <OnboardingStep
        icon={ShieldCheck}
        eyebrow="Alertas por email"
        title="¿Quieres recibir alertas preventivas?"
        description="Puedes cambiar esta decisión y elegir cada tipo de alerta más adelante en Configuración."
      >
        <OnboardingCheckbox id="emailAlertsEnabled" name="emailAlertsEnabled">
          Quiero recibir alertas preventivas por email.
        </OnboardingCheckbox>
      </OnboardingStep>

      <OnboardingStep
        icon={ShieldCheck}
        eyebrow="Reglas de uso"
        title="Confirmaciones responsables"
        description="StakeControl está diseñado para registrar y revisar, no para empujarte a apostar."
      >
        <div className="space-y-3">
          {!ageConfirmed && (
            <OnboardingCheckbox id="ageConfirmed" name="ageConfirmed">
              Confirmo que soy mayor de 18 años.
            </OnboardingCheckbox>
          )}

          <OnboardingCheckbox
            id="platformDisclaimerAccepted"
            name="platformDisclaimerAccepted"
          >
            Entiendo que StakeControl no recomienda apuestas, mercados ni selecciones.
          </OnboardingCheckbox>

          <OnboardingCheckbox
            id="performanceDisclaimerAccepted"
            name="performanceDisclaimerAccepted"
          >
            Entiendo que el rendimiento pasado no garantiza resultados futuros y puede estar influido por varianza.
          </OnboardingCheckbox>

          {!termsAccepted && (
            <OnboardingCheckbox id="termsAccepted" name="termsAccepted">
              Acepto los{" "}
              <Link href="/terms" className="font-semibold text-primary underline-offset-4 hover:underline">
                términos
              </Link>{" "}
              y la{" "}
              <Link href="/privacy" className="font-semibold text-primary underline-offset-4 hover:underline">
                política de privacidad
              </Link>
              .
            </OnboardingCheckbox>
          )}

          <OnboardingCheckbox id="betaTermsAccepted" name="betaTermsAccepted">
            <span className="font-semibold text-foreground">Acepto las condiciones de StakeControl Beta.</span>{" "}
            Estás accediendo a una versión de prueba: el OCR puede equivocarse, los datos extraídos pueden requerir corrección y la IA no realiza diagnósticos. No existe garantía de disponibilidad. Puedo comunicar errores y solicitar la eliminación de mis datos mediante{" "}
            <a href="mailto:contact@getstakecontrol.com" className="font-semibold text-primary underline-offset-4 hover:underline">contact@getstakecontrol.com</a>.
          </OnboardingCheckbox>
        </div>
      </OnboardingStep>

      {state.error && (
        <p className="rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" />
          <span>Al terminar irás a Salud de juego para revisar tu punto de partida.</span>
        </div>
        <SubmitButton idleLabel="Entrar a StakeControl" pendingLabel="Guardando..." />
      </div>
    </form>
  );
}
