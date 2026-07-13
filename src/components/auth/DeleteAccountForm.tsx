"use client";

import { useActionState } from "react";
import { deleteAccountAction, type AuthActionState } from "@/lib/auth-actions";

const initialState: AuthActionState = {};

export function DeleteAccountForm() {
  const [state, action] = useActionState(deleteAccountAction, initialState);

  return (
    <form action={action} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
      <input
        name="confirmation"
        placeholder="Escribe ELIMINAR"
        className="rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground"
        aria-label="Confirmación para eliminar cuenta"
      />
      <button
        type="submit"
        className="rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Eliminar cuenta
      </button>
      {state.error && (
        <p className="rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger sm:col-span-2">
          {state.error}
        </p>
      )}
    </form>
  );
}
