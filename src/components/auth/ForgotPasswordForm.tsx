"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordResetAction,
  type PasswordRecoveryActionState,
} from "@/lib/password-recovery-actions";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: PasswordRecoveryActionState = {};

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordResetAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      </div>

      {state.error && <p className="rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">{state.error}</p>}
      {state.success && <p className="rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">{state.success}</p>}

      <SubmitButton idleLabel="Solicitar recuperación" pendingLabel="Preparando..." />

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-primary hover:text-primary-hover">
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}
