"use client";

import { useEffect, useState } from "react";
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/analytics/analytics-consent";
import { enableProductAnalytics } from "@/lib/analytics/product-analytics";

export function AnalyticsConsent() {
  const [consent, setConsent] = useState<AnalyticsConsent>(null);
  const enabled = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = getAnalyticsConsent();
      setConsent(stored);
      if (stored === "granted") enableProductAnalytics();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!enabled || consent !== null) return null;

  function choose(value: Exclude<AnalyticsConsent, null>) {
    setAnalyticsConsent(value);
    setConsent(value);
    if (value === "granted") enableProductAnalytics();
  }

  return (
    <aside className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-2xl border border-border bg-card p-4 shadow-xl" role="dialog" aria-label="Analítica opcional">
      <p className="text-sm font-semibold text-foreground">Ayúdanos a mejorar StakeControl Beta</p>
      <p className="mt-1 text-sm leading-5 text-muted-foreground">Con tu consentimiento registramos eventos de uso técnicos. No enviamos apuestas, tickets ni datos que te identifiquen directamente.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={() => choose("granted")} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Aceptar</button>
        <button type="button" onClick={() => choose("denied")} className="rounded-xl border border-border-strong px-4 py-2 text-sm font-semibold text-foreground">No aceptar</button>
      </div>
    </aside>
  );
}
