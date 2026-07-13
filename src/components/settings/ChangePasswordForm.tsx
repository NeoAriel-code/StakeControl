"use client";

import { useActionState } from "react";
import { changePasswordAction, type SettingsActionState } from "@/lib/settings-actions";

const initialState: SettingsActionState = {};
const inputClassName =
  "w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";

export function ChangePasswordForm() {
  const [state, action] = useActionState(changePasswordAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="currentPassword" className="text-sm font-medium text-foreground">
          Contraseña actual
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className={inputClassName}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="newPassword" className="text-sm font-medium text-foreground">
            Nueva contraseña
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
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
            minLength={8}
            required
            className={inputClassName}
          />
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
        className="rounded-xl border border-border-strong px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-background"
      >
        Cambiar contraseña
      </button>
    </form>
  );
}
