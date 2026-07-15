import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Términos | StakeControl",
  description: "Términos de uso de StakeControl para su MVP global.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <FileText size={24} className="mt-1 text-primary" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                StakeControl
              </p>
              <h1 className="mt-2 text-3xl font-bold">Términos de uso</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Estos términos aplican al MVP global de StakeControl como herramienta de registro, análisis histórico
                y autocontrol.
              </p>
            </div>
          </div>
        </div>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Quién presta el servicio y contacto</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            StakeControl es una empresa chilena. Para soporte y asuntos generales, escríbenos a
            contact@getstakecontrol.com. Para asuntos de privacidad, escríbenos a privacy@getstakecontrol.com.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Descripción y límites del servicio</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            StakeControl es una herramienta de registro, análisis histórico y autocontrol. No es un operador, casa de
            apuestas, procesador de pagos, intermediario ni asesor de apuestas: no acepta, ejecuta, procesa, transmite,
            liquida ni intermedia apuestas. Tampoco ofrece afiliados, enlaces a operadores, bonos, promociones,
            comparaciones de promociones ni recomendaciones de casas, mercados, selecciones o stakes.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Uso global y cumplimiento local</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            El servicio puede estar disponible globalmente. Debes verificar y cumplir la normativa aplicable en tu
            ubicación; la disponibilidad de StakeControl no afirma que las apuestas u otras actividades relacionadas
            sean legales en una jurisdicción determinada.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Cuenta y uso permitido</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            El servicio es para mayores de edad. Debes proporcionar información veraz, proteger tus credenciales y usar
            StakeControl solo para fines personales y lícitos.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Conductas prohibidas</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            No puedes usar el servicio de forma ilícita, suplantar a terceros, interferir con su funcionamiento,
            extraer datos de manera automatizada sin autorización, cargar contenido sin derechos o usar StakeControl
            para facilitar, promocionar o intermediar apuestas.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Uso responsable</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            StakeControl no recomienda apuestas, mercados, selecciones ni aumentos de stake. Los reportes, alertas y
            métricas se basan en datos históricos, pueden estar influidos por muestra pequeña o varianza y no prometen
            rendimiento. Eres responsable de tus decisiones y de revisar tus propios límites. Si notas pérdida de
            control, considera pausar temporalmente y buscar apoyo profesional o recursos locales.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">OCR e inteligencia artificial</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            El OCR y la IA son herramientas de apoyo. Pueden producir información incompleta o incorrecta y debes
            revisarla antes de usarla. No constituyen asesoría financiera, jurídica, médica ni de apuestas, y no toman
            decisiones automáticas sobre ti ni tus apuestas.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Planes y pagos del MVP</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Los niveles Free y Premium son niveles de acceso del MVP. Actualmente no hay pasarela de pago, cargos,
            renovaciones automáticas ni reembolsos activos. Antes de habilitar pagos, StakeControl informará las
            condiciones aplicables y solicitará las aceptaciones necesarias.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Propiedad intelectual</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            StakeControl y sus contenidos son de nuestra propiedad o se usan con autorización. Te otorgamos una
            licencia limitada, personal, revocable e intransferible para usar el servicio conforme a estos términos.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Disponibilidad, suspensión y cierre</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            El MVP puede contener errores, cambios o interrupciones. Podemos modificar, suspender o cerrar el servicio
            o una cuenta por seguridad, operación o incumplimiento, procurando aviso razonable cuando sea posible.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Limitación de responsabilidad</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            En la máxima medida permitida por la ley aplicable, StakeControl no responde por decisiones de apuesta,
            pérdidas, datos incompletos o resultados derivados del uso del servicio. Nada de estos términos excluye una
            responsabilidad que no pueda limitarse legalmente.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Cambios a estos términos</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Podemos actualizar estos términos a medida que evolucione el MVP. La versión vigente estará disponible en
            esta página y, cuando sea posible, procuraremos avisar con antelación razonable sobre cambios relevantes.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Ley aplicable</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Estos términos se rigen por las leyes de Chile, sin limitar los derechos irrenunciables que te correspondan
            conforme a normas obligatorias de protección al consumidor ni las reglas de competencia imperativa
            aplicables.
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/privacy" className="rounded-xl border border-border-strong px-4 py-3 text-sm font-semibold">
            Ver privacidad
          </Link>
          <Link href="/dashboard" className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
            Volver a StakeControl
          </Link>
        </div>
      </section>
    </main>
  );
}
