"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RefreshCw } from "lucide-react";

const statusCopy: Record<string, string> = {
  queued: "En cola para procesamiento",
  ocr_processing: "Extrayendo el texto del ticket",
  ai_processing: "Estructurando los datos para revisión",
  failed: "El procesamiento necesita reanudarse",
};

export function TicketProcessingPanel({ ticketId, initialStatus }: { ticketId: string; initialStatus: string }) {
  const router = useRouter();
  const startedAt = useRef(0);
  const attempts = useRef(0);
  const [status, setStatus] = useState(initialStatus);
  const [pollingStopped, setPollingStopped] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string>();
  const [pollingGeneration, setPollingGeneration] = useState(0);

  useEffect(() => {
    if (startedAt.current === 0) startedAt.current = Date.now();
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;
    async function poll() {
      if (Date.now() - startedAt.current >= 120_000) {
        if (!cancelled) setPollingStopped(true);
        return;
      }
      try {
        const response = await fetch(`/api/tickets/${ticketId}/extraction`, { cache: "no-store" });
        if (response.ok) {
          const data = await response.json() as { status: string; ready: boolean };
          if (cancelled) return;
          setStatus(data.status);
          if (data.ready) {
            router.refresh();
            return;
          }
        }
      } finally {
        if (!cancelled) {
          attempts.current += 1;
          const delay = Math.min(1_000 * 2 ** Math.min(attempts.current, 3), 10_000);
          timeout = setTimeout(poll, delay);
        }
      }
    }
    timeout = setTimeout(poll, 1_000);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [pollingGeneration, router, ticketId]);

  async function retry() {
    setRetrying(true);
    setError(undefined);
    const response = await fetch(`/api/tickets/${ticketId}/extraction`, { method: "POST" });
    const data = await response.json().catch(() => ({})) as { error?: string; status?: string };
    if (!response.ok) {
      setError(data.error ?? "No se pudo reanudar el procesamiento.");
      setRetrying(false);
      return;
    }
    attempts.current = 0;
    startedAt.current = Date.now();
    setStatus(data.status ?? "queued");
    setPollingStopped(false);
    setPollingGeneration((generation) => generation + 1);
    setRetrying(false);
    router.refresh();
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-8 shadow-sm">
      <div className="flex items-start gap-4">
        <LoaderCircle className="mt-1 animate-spin text-primary" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">{statusCopy[status] ?? "Procesando ticket"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Puedes cerrar esta página. El archivo se procesa de forma privada y ninguna apuesta se crea sin tu revisión.
          </p>
          {(status === "failed" || pollingStopped) && (
            <button type="button" onClick={retry} disabled={retrying} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border-strong px-4 py-3 text-sm font-semibold">
              <RefreshCw size={16} className={retrying ? "animate-spin" : ""} />
              {retrying ? "Reanudando…" : "Reintentar de forma segura"}
            </button>
          )}
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        </div>
      </div>
    </section>
  );
}
