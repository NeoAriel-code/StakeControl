import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacidad | StakeControl",
  description: "Política de privacidad de StakeControl.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck size={24} className="mt-1 text-primary" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                StakeControl
              </p>
              <h1 className="mt-2 text-3xl font-bold">Política de privacidad</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Esta política describe cómo StakeControl trata datos personales, tickets e información financiera
                registrada por el usuario para fines de autocontrol.
              </p>
            </div>
          </div>
        </div>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Responsable y contacto</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            StakeControl es responsable del tratamiento de los datos descritos en esta política. Para consultas o
            solicitudes de privacidad, escríbenos a privacy@getstakecontrol.com.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Datos que tratamos</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Tratamos tu email, nombre opcional, preferencias, confirmaciones de onboarding, apuestas registradas,
            límites configurados, alertas, tickets y sus metadatos, resultados de OCR, y reportes o análisis. No
            guardamos credenciales de casas de apuesta, no conectamos cuentas de sportsbooks y no solicitamos acceso a
            cuentas externas de apuestas.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Finalidades del tratamiento</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Usamos estos datos para administrar tu cuenta, procesar tickets, mantener tu historial, generar métricas,
            reportes y alertas de autocontrol, proteger el servicio, atender solicitudes de soporte y gestionar
            suscripciones cuando corresponda.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Proveedores y transferencias</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            StakeControl no vende datos personales. Para prestar el servicio podemos utilizar proveedores tecnológicos
            que procesan información por cuenta de StakeControl: Vercel para hosting y despliegue; Turso/libSQL para la
            base de datos; Supabase Storage para archivos privados de tickets cuando está configurado; Google Cloud
            Vision para OCR cuando está configurado; y OpenAI para extracción estructurada y análisis de IA cuando está
            configurado. Estos proveedores pueden procesar datos fuera de Chile, de acuerdo con sus regiones operativas
            y los acuerdos aplicables.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Uso de OCR e inteligencia artificial</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Cuando la función está habilitada, podemos enviar al proveedor de IA el texto extraído y los datos
            necesarios del ticket o historial para la extracción o el análisis solicitado. La IA es una herramienta de
            apoyo, no toma decisiones automáticas con efectos legales o equivalentes, no determina resultados de
            apuestas y no reemplaza tu criterio.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Retención y eliminación</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Conservamos los datos mientras tu cuenta esté activa. Al eliminarla, eliminamos los datos operativos y los
            archivos privados asociados. Las copias de seguridad pueden conservarse hasta 30 días, salvo que una
            obligación legal aplicable exija conservar información por más tiempo.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Tus derechos</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Puedes solicitar acceso, rectificación, supresión o portabilidad de tus datos escribiendo a
            privacy@getstakecontrol.com. Responderemos dentro del plazo legal aplicable.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Menores de edad</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            StakeControl es un servicio exclusivo para mayores de edad.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Cookies y almacenamiento local</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Usamos cookies y almacenamiento local esenciales para recordar preferencias y mantener el funcionamiento
            del servicio. Si incorporamos analítica u otras tecnologías no esenciales, actualizaremos esta política y
            solicitaremos el aviso o consentimiento que corresponda.
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/terms" className="rounded-xl border border-border-strong px-4 py-3 text-sm font-semibold">
            Ver términos
          </Link>
          <Link href="/dashboard" className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
            Volver a StakeControl
          </Link>
        </div>
      </section>
    </main>
  );
}
