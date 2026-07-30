"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { getAnalyticsConsent, setAnalyticsConsent } from "@/lib/analytics/analytics-consent";
import { disableProductAnalytics, enableProductAnalytics } from "@/lib/analytics/product-analytics";

export function AnalyticsPreferences() {
  const [enabled, setEnabled] = useState(() => getAnalyticsConsent() === "granted");
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;

  function update(next: boolean) {
    setAnalyticsConsent(next ? "granted" : "denied");
    if (next) enableProductAnalytics(); else disableProductAnalytics();
    setEnabled(next);
  }

  return <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
    <div className="flex items-start gap-3"><BarChart3 size={22} className="mt-1 text-secondary" /><div><h2 className="text-xl font-semibold text-foreground">Analítica de producto</h2><p className="mt-1 text-sm text-muted-foreground">{enabled ? "Activa: recibimos sólo eventos técnicos de uso; el evento de feedback no incluye su descripción ni datos sensibles." : "Desactivada: no enviamos eventos de uso. Aun así puedes enviar feedback, que se guarda con los consentimientos que elijas."}</p></div></div>
    <button type="button" onClick={() => update(!enabled)} className="mt-5 rounded-xl border border-border-strong px-4 py-3 text-sm font-semibold text-foreground">{enabled ? "Desactivar analítica" : "Activar analítica"}</button>
  </section>;
}
