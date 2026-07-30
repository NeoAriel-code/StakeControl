"use client";

import { useEffect, useState } from "react";

type Feedback = { id: string; category: string; description: string; currentPath: string; technicalData: unknown; reviewStatus: "NEW" | "IN_REVIEW" | "RESOLVED"; createdAt: string; contact: { name: string | null; email: string } | null };
type Metric = { provider: string; model: string; confidenceBand: string; total: number; completelyCorrectPercent: number; partiallyCorrectPercent: number; incorrectPercent: number };

export function AdminFeedbackPanels() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  async function load() {
    const params = new URLSearchParams({ page: String(page) });
    if (category !== "ALL") params.set("category", category);
    if (status !== "ALL") params.set("status", status);
    const [feedbackResult, metricsResult] = await Promise.all([fetch(`/api/admin/feedback?${params}`), fetch("/api/admin/ocr-feedback-metrics")]);
    if (feedbackResult.ok) { const data = await feedbackResult.json(); setFeedback(data.feedback); setPages(data.totalPages); }
    if (metricsResult.ok) { const data = await metricsResult.json(); setMetrics(data.metrics); }
  }
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [category, status, page]); // eslint-disable-line react-hooks/exhaustive-deps
  async function changeStatus(id: string, reviewStatus: Feedback["reviewStatus"]) { await fetch("/api/admin/feedback", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, reviewStatus }) }); await load(); }
  return <div className="grid gap-6 xl:grid-cols-2">
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-slate-100">
      <h2 className="text-lg font-bold">Feedback de producto</h2><p className="mt-1 text-xs text-slate-400">Sin tickets, OCR ni datos de apuestas.</p>
      <div className="mt-4 flex gap-2"><select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="rounded-lg bg-slate-800 p-2 text-sm"><option value="ALL">Todas las categorías</option><option value="ERROR">Error</option><option value="CONFUSING_FEATURE">Función confusa</option><option value="SUGGESTION">Sugerencia</option></select><select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-lg bg-slate-800 p-2 text-sm"><option value="ALL">Todos los estados</option><option value="NEW">Nuevo</option><option value="IN_REVIEW">En revisión</option><option value="RESOLVED">Resuelto</option></select></div>
      <div className="mt-4 space-y-3">{feedback.length === 0 ? <p className="text-sm text-slate-400">No hay feedback para estos filtros.</p> : feedback.map((item) => <article key={item.id} className="rounded-xl border border-white/10 p-3 text-sm"><div className="flex justify-between gap-2"><span className="font-semibold">{item.category}</span><time className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</time></div><p className="mt-2 whitespace-pre-wrap">{item.description}</p><p className="mt-2 text-xs text-slate-400">Pantalla: {item.currentPath}{item.technicalData ? " · contexto técnico autorizado" : ""}</p>{item.contact && <p className="mt-1 text-xs text-slate-300">Contacto autorizado: {item.contact.name ?? item.contact.email} · {item.contact.email}</p>}<select aria-label="Estado de revisión" value={item.reviewStatus} onChange={(e) => changeStatus(item.id, e.target.value as Feedback["reviewStatus"])} className="mt-2 rounded bg-slate-800 p-1 text-xs"><option value="NEW">Nuevo</option><option value="IN_REVIEW">En revisión</option><option value="RESOLVED">Resuelto</option></select></article>)}</div>
      <div className="mt-4 flex justify-between"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="text-sm disabled:opacity-40">Anterior</button><span className="text-xs text-slate-400">Página {page} de {pages}</span><button disabled={page >= pages} onClick={() => setPage(page + 1)} className="text-sm disabled:opacity-40">Siguiente</button></div>
    </section>
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-slate-100"><h2 className="text-lg font-bold">Calidad de extracción OCR</h2><p className="mt-1 text-xs text-slate-400">Métricas agregadas de respuestas voluntarias; no hay contenido de tickets.</p><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-slate-400"><tr><th className="pb-2">Proveedor + IA</th><th>Modelo</th><th>Banda</th><th>Respuestas</th><th>Correcta</th><th>Parcial</th><th>No</th></tr></thead><tbody>{metrics.map((metric) => <tr key={`${metric.provider}-${metric.model}-${metric.confidenceBand}`} className="border-t border-white/10"><td className="py-2">{metric.provider}</td><td>{metric.model}</td><td>{metric.confidenceBand}</td><td>{metric.total}</td><td>{metric.completelyCorrectPercent}%</td><td>{metric.partiallyCorrectPercent}%</td><td>{metric.incorrectPercent}%</td></tr>)}{metrics.length === 0 && <tr><td colSpan={7} className="py-4 text-slate-400">Aún no hay evaluaciones.</td></tr>}</tbody></table></div></section>
  </div>;
}
