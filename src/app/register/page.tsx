import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";
import { redirectAuthenticatedUser } from "@/lib/auth";

export default async function RegisterPage() {
  await redirectAuthenticatedUser();

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            StakeControl
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Crear cuenta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Configura tu acceso inicial, país, moneda por defecto y confirmaciones legales.
          </p>
        </div>

        <RegisterForm />
      </div>
      <footer className="mx-auto mt-6 flex max-w-md justify-center gap-4 text-xs text-muted-foreground">
        <Link href="/terms" className="hover:text-primary">
          Términos
        </Link>
        <Link href="/privacy" className="hover:text-primary">
          Privacidad
        </Link>
      </footer>
    </div>
  );
}
