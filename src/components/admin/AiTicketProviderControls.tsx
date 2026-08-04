"use client";

import { useEffect, useState } from "react";

type Configuration = {
  enabled: boolean;
  rolloutPercentage: number;
  circuitState: string;
  transientFailureCount: number;
  openUntil: string | null;
};

export function AiTicketProviderControls() {
  const [configuration, setConfiguration] = useState<Configuration>();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    fetch("/api/admin/ai-ticket-provider", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(setConfiguration)
      .catch(() => setMessage("No se pudo cargar la configuración de extracción."));
  }, []);

  async function save() {
    if (!configuration) return;
    setSaving(true);
    setMessage(undefined);
    const response = await fetch("/api/admin/ai-ticket-provider", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: configuration.enabled, rolloutPercentage: configuration.rolloutPercentage }),
    });
    const body = await response.json().catch(() => ({})) as Configuration & { error?: string };
    if (response.ok) {
      setConfiguration((current) => current ? { ...current, ...body } : body);
      setMessage("Configuración actualizada. Los workflows en curso leerán este valor antes de llamar al proveedor.");
    } else {
      setMessage(body.error ?? "No se pudo guardar la configuración.");
    }
    setSaving(false);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-slate-100">
      <h2 className="text-lg font-bold">Extracción IA de tickets</h2>
      <p className="mt-1 text-xs text-slate-400">Kill switch y canary del proveedor secundario. Los reportes responsables no usan esta ruta.</p>
      {configuration && (
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={configuration.enabled} onChange={(event) => setConfiguration({ ...configuration, enabled: event.target.checked })} />
            Tráfico habilitado
          </label>
          <label className="text-sm">
            <span className="block text-xs text-slate-400">Rollout (%)</span>
            <input type="number" min={0} max={100} value={configuration.rolloutPercentage} onChange={(event) => setConfiguration({ ...configuration, rolloutPercentage: Math.max(0, Math.min(100, Number(event.target.value))) })} className="mt-1 w-24 rounded bg-slate-800 p-2" />
          </label>
          <div className="text-xs text-slate-400">Circuito: <span className="font-semibold text-slate-200">{configuration.circuitState}</span></div>
          <button type="button" onClick={save} disabled={saving} className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold disabled:opacity-50">{saving ? "Guardando…" : "Aplicar"}</button>
        </div>
      )}
      {message && <p className="mt-3 text-xs text-slate-300">{message}</p>}
    </section>
  );
}
