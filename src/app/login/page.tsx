import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";
import { redirectAuthenticatedUser } from "@/lib/auth";

export default async function LoginPage() {
  await redirectAuthenticatedUser();

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            StakeControl
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Accede a tu panel y sigue tu actividad de apuestas con control y contexto.
          </p>
        </div>

        <LoginForm />
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
