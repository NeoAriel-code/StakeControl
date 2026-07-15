import Image from "next/image";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

type ResetPasswordPageProps = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  return (
    <div className="auth-stage flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="auth-panel p-7 sm:p-9">
          <Image src="/brand/stakecontrol-logo-horizontal.svg" alt="StakeControl" width={190} height={45} priority className="h-auto w-[160px] dark:hidden" />
          <Image src="/brand/stakecontrol-logo-white.svg" alt="StakeControl" width={190} height={45} priority className="hidden h-auto w-[160px] dark:block" />
          <p className="auth-kicker mt-8">Acceso personal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Nueva contraseña</h1>
          <p className="mt-2 text-sm text-muted-foreground">Elige una contraseña de al menos ocho caracteres.</p>
          <div className="mt-8">
            {token ? <ResetPasswordForm token={token} /> : <p className="rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">El enlace de recuperación no es válido.</p>}
          </div>
        </div>
        <footer className="mt-5 flex justify-between gap-4 px-1 text-xs font-medium text-muted-foreground"><Link href="/terms" className="hover:text-primary">Términos</Link><Link href="/privacy" className="hover:text-primary">Privacidad</Link></footer>
      </div>
    </div>
  );
}
