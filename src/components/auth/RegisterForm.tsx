"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Globe2, ShieldCheck } from "lucide-react";
import { registerAction, type AuthActionState } from "@/lib/auth-actions";
import { COUNTRY_OPTIONS, getCountryRegistrationDefaults } from "@/lib/countries";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: AuthActionState = {};
const inputClassName =
  "w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, initialState);
  const [country, setCountry] = useState("CL");
  const defaults = getCountryRegistrationDefaults(country);

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Nombre
          </label>
          <input id="name" name="name" type="text" autoComplete="name" className={inputClassName} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className={inputClassName} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="country" className="text-sm font-medium text-foreground">
            País de residencia
          </label>
          <select
            id="country"
            name="country"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            required
            className={inputClassName}
          >
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-border bg-background p-4 sm:col-span-2">
          <div className="flex items-start gap-3">
            <Globe2 size={18} className="mt-0.5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-foreground">Preferencias iniciales</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Usaremos <span className="font-semibold text-foreground">{defaults.currency}</span> como moneda
                principal por defecto. Si la moneda local no está disponible, usamos USD.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
            Confirmar contraseña
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-background p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 text-success" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-foreground">Confirmaciones necesarias</p>
            <p className="mt-1 text-sm text-muted-foreground">
              StakeControl es una herramienta de registro y autocontrol. No recomienda apuestas ni predice resultados.
            </p>
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-text-secondary">
          <input
            id="ageConfirmed"
            name="ageConfirmed"
            type="checkbox"
            required
            className="mt-1 h-4 w-4 rounded border-border-strong text-primary focus:ring-primary"
          />
          <span>Confirmo que soy mayor de 18 años.</span>
        </label>

        <label className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-text-secondary">
          <input
            id="termsAccepted"
            name="termsAccepted"
            type="checkbox"
            required
            className="mt-1 h-4 w-4 rounded border-border-strong text-primary focus:ring-primary"
          />
          <span>
            Acepto los{" "}
            <Link href="/terms" className="font-semibold text-primary underline-offset-4 hover:underline">
              términos
            </Link>{" "}
            y la{" "}
            <Link href="/privacy" className="font-semibold text-primary underline-offset-4 hover:underline">
              política de privacidad
            </Link>
            .
          </span>
        </label>
      </div>

      {state.error && (
        <p className="rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <SubmitButton idleLabel="Crear cuenta" pendingLabel="Creando cuenta..." />

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-primary hover:text-primary-hover">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
