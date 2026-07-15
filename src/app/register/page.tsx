import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";
import Image from "next/image";
import { redirectAuthenticatedUser } from "@/lib/auth";

export default async function RegisterPage() {
  await redirectAuthenticatedUser();

  return (
    <div className="auth-stage flex items-center justify-center">
      <div className="w-full max-w-2xl">
      <div className="auth-panel p-7 sm:p-9">
        <div className="mb-8">
          <Image
            src="/brand/stakecontrol-logo-horizontal.svg"
            alt="StakeControl"
            width={190}
            height={45}
            priority
            className="h-auto w-[160px] dark:hidden"
          />
          <Image
            src="/brand/stakecontrol-logo-white.svg"
            alt="StakeControl"
            width={190}
            height={45}
            priority
            className="hidden h-auto w-[160px] dark:block"
          />
          <p className="auth-kicker mt-8">Paso 01 · Configuración inicial</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Crear cuenta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Configura tu acceso inicial, país, moneda por defecto y confirmaciones legales.
          </p>
        </div>

        <RegisterForm />
      </div>
      <footer className="mt-5 flex justify-between gap-4 px-1 text-xs font-medium text-muted-foreground">
        <Link href="/terms" className="hover:text-primary">
          Términos
        </Link>
        <Link href="/privacy" className="hover:text-primary">
          Privacidad
        </Link>
      </footer>
      </div>
    </div>
  );
}
