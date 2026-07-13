"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthActionState } from "@/lib/auth-actions";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: AuthActionState = {};

export function LoginForm() {
  const [state, action] = useActionState(loginAction, initialState);

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

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      </div>

      {state.error && (
        <p className="rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <SubmitButton idleLabel="Iniciar sesión" pendingLabel="Ingresando..." />

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-semibold text-primary hover:text-primary-hover">
          Regístrate
        </Link>
      </p>
    </form>
  );
}
