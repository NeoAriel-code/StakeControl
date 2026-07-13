"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type AuthActionState } from "@/lib/auth-actions";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: AuthActionState = {};

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      </div>

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
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
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
          className="w-full rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
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
