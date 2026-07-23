import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { verifyEmailToken } from "@/lib/email-verification";
import { getEmailDeliveryService } from "@/lib/email/email-service";

type VerifyEmailPageProps = { searchParams: Promise<{ token?: string }> };

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;
  const userId = token ? await verifyEmailToken(token) : null;

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
    const service = getEmailDeliveryService();
    if (user && service) {
      await service.sendWelcome({ userId: user.id, email: user.email });
    }
  }

  const verified = Boolean(userId);

  return (
    <div className="auth-stage flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="auth-panel p-7 sm:p-9">
          <Image src="/brand/stakecontrol-logo-horizontal.svg" alt="StakeControl" width={190} height={45} priority className="h-auto w-[160px] dark:hidden" />
          <Image src="/brand/stakecontrol-logo-white.svg" alt="StakeControl" width={190} height={45} priority className="hidden h-auto w-[160px] dark:block" />
          <p className="auth-kicker mt-8">Seguridad de cuenta</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">{verified ? "Correo confirmado" : "Enlace no válido"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{verified ? "Tu cuenta ya está activa. Ahora puedes iniciar sesión y completar la configuración inicial." : "El enlace venció o ya fue utilizado. Solicita uno nuevo para continuar."}</p>
          <div className="mt-8"><Link href={verified ? "/login" : "/verify-email/resend"} className="inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover">{verified ? "Iniciar sesión" : "Solicitar nuevo enlace"}</Link></div>
        </div>
        <footer className="mt-5 flex justify-between gap-4 px-1 text-xs font-medium text-muted-foreground"><Link href="/terms" className="hover:text-primary">Términos</Link><Link href="/privacy" className="hover:text-primary">Privacidad</Link></footer>
      </div>
    </div>
  );
}
