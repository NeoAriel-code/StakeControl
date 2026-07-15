"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  resetPasswordAction,
  type PasswordRecoveryActionState,
} from "@/lib/password-recovery-actions";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: PasswordRecoveryActionState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction.bind(null, token), initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">Nueva contraseña</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
      </div>
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">Confirmar contraseña</label>
        <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
      </div>

      {state.error && <p className="rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">{state.error}</p>}
      <SubmitButton idleLabel="Guardar contraseña" pendingLabel="Guardando..." />

      <p className="text-center text-sm text-muted-foreground"><Link href="/login" className="font-semibold text-primary hover:text-primary-hover">Volver a iniciar sesión</Link></p>
    </form>
  );
}
