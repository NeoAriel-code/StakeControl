import Link from "next/link";
import { AlertTriangle } from "lucide-react";

type EmailSecurityAlertProps = {
  alerts: Array<{ id: string; kind: string; occurredAt: Date }>;
};

export function EmailSecurityAlert({ alerts }: EmailSecurityAlertProps) {
  if (alerts.length === 0) return null;

  return (
    <section className="mb-5 rounded-2xl border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-foreground" aria-label="Alerta de correo de seguridad">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0 text-warning" size={18} aria-hidden="true" />
        <p>
          No pudimos confirmar la entrega de un correo de seguridad. Revisa que tu dirección de contacto esté disponible o escribe a{" "}
          <Link href="mailto:support@getstakecontrol.com" className="font-semibold text-primary underline underline-offset-2">support@getstakecontrol.com</Link>.
        </p>
      </div>
    </section>
  );
}
