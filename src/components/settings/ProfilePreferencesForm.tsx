"use client";

import { useActionState } from "react";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { CURRENCY_OPTIONS } from "@/lib/currencies";
import { updateProfilePreferencesAction, type SettingsActionState } from "@/lib/settings-actions";

const initialState: SettingsActionState = {};

type ProfilePreferencesFormProps = {
  defaultValues: {
    name: string;
    country: string;
    currency: string;
    timezone: string;
    oddsFormat: "DECIMAL" | "AMERICAN";
  };
};

const inputClassName =
  "w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";

export function ProfilePreferencesForm({ defaultValues }: ProfilePreferencesFormProps) {
  const [state, action] = useActionState(updateProfilePreferencesAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Nombre visible
          </label>
          <input
            id="name"
            name="name"
            defaultValue={defaultValues.name}
            className={inputClassName}
            autoComplete="name"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="country" className="text-sm font-medium text-foreground">
            País de residencia
          </label>
          <select id="country" name="country" defaultValue={defaultValues.country} className={inputClassName}>
            {COUNTRY_OPTIONS.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="currency" className="text-sm font-medium text-foreground">
            Moneda principal
          </label>
          <select id="currency" name="currency" defaultValue={defaultValues.currency} className={inputClassName}>
            {CURRENCY_OPTIONS.map((currency) => (
              <option key={currency.value} value={currency.value}>
                {currency.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="timezone" className="text-sm font-medium text-foreground">
            Zona horaria
          </label>
          <select id="timezone" name="timezone" defaultValue={defaultValues.timezone} className={inputClassName}>
            <option value="America/Santiago">Chile - Santiago</option>
            <option value="America/Argentina/Buenos_Aires">Argentina - Buenos Aires</option>
            <option value="America/Mexico_City">México - Ciudad de México</option>
            <option value="America/Bogota">Colombia - Bogotá</option>
            <option value="America/Lima">Perú - Lima</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="oddsFormat" className="text-sm font-medium text-foreground">
            Tipo de cuota
          </label>
          <select id="oddsFormat" name="oddsFormat" defaultValue={defaultValues.oddsFormat} className={inputClassName}>
            <option value="DECIMAL">Decimal (1.85)</option>
            <option value="AMERICAN">Americana (-118 / +150)</option>
          </select>
        </div>
      </div>

      {state.error && (
        <p className="rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
      >
        Guardar preferencias
      </button>
    </form>
  );
}
