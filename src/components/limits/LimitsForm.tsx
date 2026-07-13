"use client";

import { useActionState, useState } from "react";
import { updateLimitsAction, type LimitsActionState } from "@/lib/limit-actions";

const initialState: LimitsActionState = {};

type LimitsFormProps = {
  limits: {
    dailyStakeLimit: string | null;
    weeklyStakeLimit: string | null;
    monthlyStakeLimit: string | null;
    maxStakePerBet: string | null;
    pauseUntil: string | null;
  } | null;
};

function toInputValue(value: unknown) {
  if (value == null) return "";
  return String(value);
}

function toDateTimeLocal(value: Date | null | undefined) {
  if (!value) return "";
  const offset = value.getTimezoneOffset();
  const localDate = new Date(value.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

export function LimitsForm({ limits }: LimitsFormProps) {
  const [state, action] = useActionState(updateLimitsAction, initialState);
  const [pausePreset, setPausePreset] = useState("none");
  const pauseUntilDate = limits?.pauseUntil ? new Date(limits.pauseUntil) : null;
  const hasActivePause = Boolean(pauseUntilDate && pauseUntilDate > new Date());

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="dailyStakeLimit" className="text-sm font-medium text-foreground">
            Límite diario
          </label>
          <input
            id="dailyStakeLimit"
            name="dailyStakeLimit"
            type="number"
            min="0"
            step="0.01"
            defaultValue={toInputValue(limits?.dailyStakeLimit)}
            className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="weeklyStakeLimit" className="text-sm font-medium text-foreground">
            Límite semanal
          </label>
          <input
            id="weeklyStakeLimit"
            name="weeklyStakeLimit"
            type="number"
            min="0"
            step="0.01"
            defaultValue={toInputValue(limits?.weeklyStakeLimit)}
            className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="monthlyStakeLimit" className="text-sm font-medium text-foreground">
            Límite mensual
          </label>
          <input
            id="monthlyStakeLimit"
            name="monthlyStakeLimit"
            type="number"
            min="0"
            step="0.01"
            defaultValue={toInputValue(limits?.monthlyStakeLimit)}
            className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="maxStakePerBet" className="text-sm font-medium text-foreground">
            Stake máximo por apuesta
          </label>
          <input
            id="maxStakePerBet"
            name="maxStakePerBet"
            type="number"
            min="0"
            step="0.01"
            defaultValue={toInputValue(limits?.maxStakePerBet)}
            className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background p-4">
        <div className="flex flex-col gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Pausa voluntaria</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Activa un período de pausa para bloquear nuevos registros manuales y carga de tickets.
            </p>
          </div>

          {hasActivePause && (
            <p className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning-foreground">
              Actualmente tienes una pausa activa hasta {new Intl.DateTimeFormat("es-CL", {
                dateStyle: "long",
                timeStyle: "short",
              }).format(pauseUntilDate!)}.
            </p>
          )}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="pausePreset" className="text-sm font-medium text-foreground">
              Duración de la pausa
            </label>
            <select
              id="pausePreset"
              name="pausePreset"
              value={pausePreset}
              onChange={(event) => setPausePreset(event.target.value)}
              className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground"
            >
              <option value="none">No cambiar pausa</option>
              <option value="24h">24 horas</option>
              <option value="7d">7 días</option>
              <option value="30d">30 días</option>
              <option value="custom">Fecha personalizada</option>
              <option value="clear">Desactivar pausa actual</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="customPauseUntil" className="text-sm font-medium text-foreground">
              Fecha personalizada
            </label>
            <input
              id="customPauseUntil"
              name="customPauseUntil"
              type="datetime-local"
              disabled={pausePreset !== "custom"}
              defaultValue={toDateTimeLocal(pauseUntilDate)}
              className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
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
        Guardar límites
      </button>
    </form>
  );
}
