"use client";

import { useActionState } from "react";
import { CheckCircle2, FlaskConical } from "lucide-react";
import { acceptBetaTermsAction, type AuthActionState } from "@/lib/auth-actions";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: AuthActionState = {};

export function BetaTermsForm() {
  const [state, action] = useActionState(acceptBetaTermsAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <div className="flex gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm leading-6 text-foreground">
        <FlaskConical className="mt-0.5 shrink-0 text-primary" size={19} />
        <p><span className="font-bold">Estás accediendo a StakeControl Beta.</span> Es una versión de prueba y puede cambiar mientras validamos el producto.</p>
      </div>
      <div className="space-y-3 text-sm leading-6 text-muted-foreground">
        <p>El OCR puede equivocarse y los datos extraídos pueden requerir corrección. Revisa siempre cada ticket antes de confirmarlo.</p>
        <p>La IA no realiza diagnósticos ni recomienda apuestas. La disponibilidad del servicio no está garantizada durante la beta.</p>
        <p>Puedes comunicar errores a <a className="font-semibold text-primary underline-offset-4 hover:underline" href="mailto:contact@getstakecontrol.com">contact@getstakecontrol.com</a> y solicitar la eliminación de tus datos.</p>
      </div>
      {state.error && <p className="rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">{state.error}</p>}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-3 text-sm text-muted-foreground"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" />Al continuar aceptas las condiciones de la versión beta.</p>
        <SubmitButton idleLabel="Aceptar y continuar" pendingLabel="Guardando..." />
      </div>
    </form>
  );
}
