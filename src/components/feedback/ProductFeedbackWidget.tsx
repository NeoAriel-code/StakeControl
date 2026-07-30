"use client";

import { useActionState, useEffect, useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { captureProductEvent } from "@/lib/analytics/product-analytics";
import { getAnalyticsConsent } from "@/lib/analytics/analytics-consent";
import { submitProductFeedbackAction, type ProductFeedbackActionState } from "@/lib/feedback-actions";

const initialState: ProductFeedbackActionState = {};

function technicalContext() {
  if (typeof navigator === "undefined") return { browser: "Other", operatingSystem: "Other" };
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Other";
  const operatingSystem = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Other";
  return { browser, operatingSystem };
}

export function ProductFeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(submitProductFeedbackAction, initialState);
  const context = typeof window === "undefined" ? { path: "/", browser: "Other", operatingSystem: "Other" } : { path: window.location.pathname, ...technicalContext() };
  useEffect(() => {
    if (!state.success || getAnalyticsConsent() !== "granted" || !state.analytics) return;
    captureProductEvent("feedback_submitted", {
      feedback_category: state.analytics.category,
      technical_data_authorized: state.analytics.technical,
      contact_authorized: state.analytics.contact,
    });
  }, [state.analytics, state.success]);

  return <>
    <button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary-hover" aria-haspopup="dialog">
      <MessageSquare size={18} aria-hidden="true" /> Enviar feedback
    </button>
    {open && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="feedback-title" className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4"><div><h2 id="feedback-title" className="text-lg font-semibold">Enviar feedback</h2><p className="mt-1 text-sm text-muted-foreground">No incluyas tickets, apuestas, importes, imágenes ni datos sensibles.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="rounded-lg p-1 hover:bg-muted"><X size={20} /></button></div>
        {state.success ? <div className="mt-5 space-y-4"><p className="text-sm text-success">Gracias. Tu feedback fue enviado.</p><button type="button" onClick={() => setOpen(false)} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Cerrar</button></div> : <form action={action} className="mt-5 space-y-4">
          <input type="hidden" name="currentPath" value={context.path} /><input type="hidden" name="browser" value={context.browser} /><input type="hidden" name="operatingSystem" value={context.operatingSystem} /><input type="hidden" name="appVersion" value={process.env.NEXT_PUBLIC_APP_VERSION ?? "web"} />
          <label className="block text-sm font-medium">Categoría<select name="category" required defaultValue="" className="mt-2 w-full rounded-xl border border-border-strong bg-background px-3 py-2"><option value="" disabled>Selecciona una categoría</option><option value="ERROR">Error</option><option value="CONFUSING_FEATURE">No entendí una función</option><option value="SUGGESTION">Sugerencia</option></select></label>
          <p className="text-xs text-muted-foreground">Pantalla actual: {context.path}</p>
          <label className="block text-sm font-medium">Descripción<textarea name="description" required minLength={10} maxLength={2000} rows={5} className="mt-2 w-full rounded-xl border border-border-strong bg-background px-3 py-2" /></label>
          <label className="flex gap-3 text-sm"><input name="includeTechnicalData" type="checkbox" /> <span>Autorizo incluir navegador, sistema operativo, ruta y versión de la app.</span></label>
          <label className="flex gap-3 text-sm"><input name="contactPermission" type="checkbox" /> <span>Autorizo que StakeControl conserve mi cuenta para contactarme sobre este feedback.</span></label>
          {state.error && <p className="text-sm text-danger">{state.error}</p>}
          <button disabled={pending} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{pending ? "Enviando…" : "Enviar feedback"}</button>
        </form>}
      </div>
    </div>}
  </>;
}
