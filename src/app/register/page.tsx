import { RegisterForm } from "@/components/auth/RegisterForm";
import { redirectAuthenticatedUser } from "@/lib/auth";

export default async function RegisterPage() {
  await redirectAuthenticatedUser();

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            StakeControl
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Crear cuenta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Crea tu acceso para registrar apuestas, revisar resultados y mantener límites personales.
          </p>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
}
