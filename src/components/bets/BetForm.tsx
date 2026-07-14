"use client";

import { useActionState, useMemo, useState } from "react";
import { BET_RESULT_LABELS, BET_TYPE_LABELS, type BetResultValue, type BetTypeValue } from "@/lib/bet-enums";
import type { BetActionState } from "@/lib/bet-actions";
import { betResultOptions, betTypeOptions } from "@/lib/bet-schemas";
import { CURRENCY_OPTIONS, isSupportedCurrency } from "@/lib/currencies";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: BetActionState = {};

type BetFormProps = {
  action: (state: BetActionState, formData: FormData) => Promise<BetActionState>;
  submitIdleLabel: string;
  submitPendingLabel: string;
  maxSingleStake?: string | null;
  defaultValues?: {
    sportsbook?: string | null;
    placedAt?: string;
    event?: string;
    sport?: string | null;
    league?: string | null;
    market?: string | null;
    selection?: string | null;
    betType?: BetTypeValue;
    stake?: string;
    odds?: string;
    currency?: string;
    potentialPayout?: string;
    result?: BetResultValue;
    netProfit?: string;
    ticketCode?: string | null;
    notes?: string | null;
  };
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="mt-1 text-xs text-danger">{message}</p>;
}

function Field({
  label,
  htmlFor,
  children,
  error,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function inputClassName(hasError?: string) {
  return `w-full rounded-xl border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 ${
    hasError ? "border-danger-border" : "border-border-strong"
  }`;
}

export function BetForm({
  action,
  submitIdleLabel,
  submitPendingLabel,
  maxSingleStake,
  defaultValues,
}: BetFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const values = defaultValues ?? {};
  const [stakeValue, setStakeValue] = useState(values.stake ?? "");
  const [confirmLargeStake, setConfirmLargeStake] = useState(false);
  const selectedCurrency = isSupportedCurrency(values.currency ?? "") ? values.currency : "USD";
  const maxSingleStakeValue = maxSingleStake ? Number(maxSingleStake) : null;
  const exceedsMaxSingleStake = useMemo(() => {
    if (!maxSingleStakeValue || stakeValue.trim() === "") {
      return false;
    }

    const stakeNumber = Number(stakeValue);
    return Number.isFinite(stakeNumber) && stakeNumber > maxSingleStakeValue;
  }, [maxSingleStakeValue, stakeValue]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning-foreground">
        <p className="font-semibold">Registro preventivo</p>
        <p className="mt-1">
          Este formulario guarda datos históricos para autocontrol. No se recomienda aumentar el stake automáticamente.
        </p>
      </div>

      {state.error && (
        <p className="rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Casa de apuesta / sportsbook" htmlFor="sportsbook" error={state.fieldErrors?.sportsbook}>
          <input id="sportsbook" name="sportsbook" defaultValue={values.sportsbook ?? ""} className={inputClassName(state.fieldErrors?.sportsbook)} />
        </Field>

        <Field label="Fecha y hora" htmlFor="placedAt" error={state.fieldErrors?.placedAt}>
          <input id="placedAt" name="placedAt" type="datetime-local" defaultValue={values.placedAt ?? ""} required className={inputClassName(state.fieldErrors?.placedAt)} />
        </Field>

        <div className="md:col-span-2">
          <Field label="Evento" htmlFor="event" error={state.fieldErrors?.event}>
            <input id="event" name="event" defaultValue={values.event ?? ""} required className={inputClassName(state.fieldErrors?.event)} />
          </Field>
        </div>

        <Field label="Deporte" htmlFor="sport" error={state.fieldErrors?.sport}>
          <input id="sport" name="sport" defaultValue={values.sport ?? ""} className={inputClassName(state.fieldErrors?.sport)} />
        </Field>

        <Field label="Liga" htmlFor="league" error={state.fieldErrors?.league}>
          <input id="league" name="league" defaultValue={values.league ?? ""} className={inputClassName(state.fieldErrors?.league)} />
        </Field>

        <Field label="Mercado" htmlFor="market" error={state.fieldErrors?.market}>
          <input id="market" name="market" defaultValue={values.market ?? ""} className={inputClassName(state.fieldErrors?.market)} />
        </Field>

        <Field label="Selección" htmlFor="selection" error={state.fieldErrors?.selection}>
          <input id="selection" name="selection" defaultValue={values.selection ?? ""} className={inputClassName(state.fieldErrors?.selection)} />
        </Field>

        <Field label="Tipo de apuesta" htmlFor="betType" error={state.fieldErrors?.betType}>
          <select id="betType" name="betType" defaultValue={values.betType ?? "SINGLE"} className={inputClassName(state.fieldErrors?.betType)}>
            {betTypeOptions.map((option) => (
              <option key={option} value={option}>
                {BET_TYPE_LABELS[option]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Stake" htmlFor="stake" error={state.fieldErrors?.stake}>
          <input
            id="stake"
            name="stake"
            type="number"
            step="0.01"
            min="0"
            value={stakeValue}
            onChange={(event) => {
              setStakeValue(event.target.value);
              setConfirmLargeStake(false);
            }}
            required
            className={inputClassName(state.fieldErrors?.stake)}
          />
        </Field>

        <Field label="Cuota" htmlFor="odds" error={state.fieldErrors?.odds}>
          <input id="odds" name="odds" type="number" step="0.01" min="1.01" defaultValue={values.odds ?? ""} required className={inputClassName(state.fieldErrors?.odds)} />
        </Field>

        <Field label="Moneda" htmlFor="currency" error={state.fieldErrors?.currency}>
          <select id="currency" name="currency" defaultValue={selectedCurrency} required className={inputClassName(state.fieldErrors?.currency)}>
            {CURRENCY_OPTIONS.map((currency) => (
              <option key={currency.value} value={currency.value}>
                {currency.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Posible retorno" htmlFor="potentialPayout" error={state.fieldErrors?.potentialPayout}>
          <input id="potentialPayout" name="potentialPayout" type="number" step="0.01" defaultValue={values.potentialPayout ?? ""} className={inputClassName(state.fieldErrors?.potentialPayout)} />
        </Field>

        <Field label="Resultado" htmlFor="result" error={state.fieldErrors?.result}>
          <select id="result" name="result" defaultValue={values.result ?? "PENDING"} className={inputClassName(state.fieldErrors?.result)}>
            {betResultOptions.map((option) => (
              <option key={option} value={option}>
                {BET_RESULT_LABELS[option]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Ganancia o pérdida neta" htmlFor="netProfit" error={state.fieldErrors?.netProfit}>
          <input id="netProfit" name="netProfit" type="number" step="0.01" defaultValue={values.netProfit ?? "0"} required className={inputClassName(state.fieldErrors?.netProfit)} />
        </Field>

        <Field label="Código de ticket opcional" htmlFor="ticketCode" error={state.fieldErrors?.ticketCode}>
          <input id="ticketCode" name="ticketCode" defaultValue={values.ticketCode ?? ""} className={inputClassName(state.fieldErrors?.ticketCode)} />
        </Field>

        <div className="md:col-span-2">
          <Field label="Notas opcionales" htmlFor="notes" error={state.fieldErrors?.notes}>
            <textarea id="notes" name="notes" rows={4} defaultValue={values.notes ?? ""} className={inputClassName(state.fieldErrors?.notes)} />
          </Field>
        </div>
      </div>

      {exceedsMaxSingleStake && maxSingleStakeValue && (
        <div className="space-y-3 rounded-2xl border border-danger-border bg-danger-soft px-4 py-4">
          <p className="text-sm font-semibold text-danger">
            Advertencia fuerte: el stake supera tu máximo por apuesta configurado ({maxSingleStake}).
          </p>
          <p className="text-sm text-danger">
            Considera revisar tus límites o pausar temporalmente antes de guardar este registro.
          </p>
          <label className="flex items-start gap-3 text-sm text-danger">
            <input
              type="checkbox"
              name="confirmLargeStake"
              checked={confirmLargeStake}
              onChange={(event) => setConfirmLargeStake(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-danger-border"
            />
            <span>Entiendo la advertencia y quiero guardar esta apuesta de todos modos.</span>
          </label>
        </div>
      )}

      <SubmitButton idleLabel={submitIdleLabel} pendingLabel={submitPendingLabel} />
    </form>
  );
}
