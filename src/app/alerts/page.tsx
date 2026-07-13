import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Bell, Clock3, ShieldPlus, SlidersHorizontal } from "lucide-react";
import type { AlertSeverity, AlertType } from "@prisma/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { acknowledgeAlertAction } from "@/lib/alert-actions";
import { requireUser } from "@/lib/auth";
import { getFeatureAccess, getPlanLabel } from "@/lib/plans";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Alertas | StakeControl",
  description: "Alertas de juego responsable con sugerencias de autocontrol y revisión de límites.",
};

const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  LIMIT_APPROACHING: "Límite acercándose",
  LIMIT_EXCEEDED: "Límite superado",
  STAKE_INCREASE: "Aumento de stake",
  LOSS_STREAK: "Racha de pérdidas",
  HIGH_FREQUENCY: "Frecuencia alta",
  PAUSE_RECOMMENDED: "Pausa sugerida",
};

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  LOW: "bg-muted text-muted-foreground border border-border",
  MEDIUM: "bg-warning-soft text-warning border border-warning/30",
  HIGH: "bg-danger-soft text-danger border border-danger-border",
};

export default async function AlertsPage() {
  const user = await requireUser();
  const intelligentAlertsAccess = await getFeatureAccess(user.id, "alerts_intelligent");
  const alerts = await prisma.responsibleGamingAlert.findMany({
    where: { userId: user.id },
    orderBy: [{ acknowledgedAt: "asc" }, { createdAt: "desc" }],
    take: 50,
  });

  const visibleAlerts = intelligentAlertsAccess.allowed
    ? alerts
    : alerts.filter(
        (alert) =>
          alert.type === "LIMIT_APPROACHING" || alert.type === "LIMIT_EXCEEDED"
      );
  const hiddenPremiumAlerts = alerts.length - visibleAlerts.length;
  const unresolvedAlerts = visibleAlerts.filter((alert) => !alert.acknowledgedAt).length;

  return (
    <AppLayout
      pageTitle="Alertas"
      userName={user.name || user.email}
      planLabel={getPlanLabel(intelligentAlertsAccess.plan)}
    >
      <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Alertas de juego responsable"
          description="Señales automáticas basadas en tu actividad registrada, orientadas a revisión y autocontrol."
          icon={Bell}
          breadcrumb="StakeControl"
          actions={
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
              <AlertTriangle size={12} />
              {unresolvedAlerts} pendientes
            </span>
          }
        />

        <section className="grid gap-4 md:grid-cols-3">
          <Link
            href="/limits"
            className="rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:bg-background"
          >
            <div className="flex items-center gap-3">
              <SlidersHorizontal size={18} className="text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Revisar límites</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ajusta límites diarios, semanales o mensuales según tu presupuesto actual.
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/limits"
            className="rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:bg-background"
          >
            <div className="flex items-center gap-3">
              <Clock3 size={18} className="text-warning" />
              <div>
                <p className="text-sm font-semibold text-foreground">Activar pausa</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Puedes activar una pausa voluntaria breve o extendida si necesitas detener nuevos registros.
                </p>
              </div>
            </div>
          </Link>

          <a
            href="#help-resources"
            className="rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:bg-background"
          >
            <div className="flex items-center gap-3">
              <ShieldPlus size={18} className="text-secondary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Ver recursos de ayuda</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Consulta recomendaciones de autocontrol y pasos prácticos para bajar la exposición.
                </p>
              </div>
            </div>
          </a>
        </section>

        {!intelligentAlertsAccess.allowed && (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Alertas inteligentes Premium</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  En Free ves alertas simples de límites. Premium desbloquea alertas por frecuencia, rachas y cambios de stake.
                </p>
                {hiddenPremiumAlerts > 0 && (
                  <p className="mt-2 text-sm text-warning">
                    Hay {hiddenPremiumAlerts} alerta(s) avanzada(s) reservada(s) para Premium.
                  </p>
                )}
              </div>
              <Link
                href="/upgrade"
                className="inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
              >
                Ver Premium
              </Link>
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-foreground">Historial de alertas</h2>
            <p className="text-sm text-muted-foreground">
              Las alertas sugieren acciones preventivas; no hacen diagnósticos.
            </p>
          </div>

          {visibleAlerts.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="Sin alertas todavía"
                description="Cuando el sistema detecte patrones relevantes de límites o frecuencia, se mostrarán aquí."
              />
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {visibleAlerts.map((alert) => (
                <article
                  key={alert.id}
                  className={`rounded-2xl border p-5 ${alert.acknowledgedAt ? "border-border bg-background" : "border-border bg-card"}`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${SEVERITY_STYLES[alert.severity]}`}>
                          {alert.severity}
                        </span>
                        <span className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                          {ALERT_TYPE_LABELS[alert.type]}
                        </span>
                        {alert.acknowledgedAt && (
                          <span className="inline-flex rounded-full border border-success/30 bg-success-soft px-3 py-1 text-xs font-semibold text-success">
                            Revisada
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-base font-semibold text-foreground">{alert.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{alert.message}</p>
                      </div>

                      <p className="text-xs text-soft">
                        Generada el{" "}
                        {new Intl.DateTimeFormat("es-CL", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(alert.createdAt)}
                      </p>
                    </div>

                    {!alert.acknowledgedAt && (
                      <form action={acknowledgeAlertAction}>
                        <input type="hidden" name="alertId" value={alert.id} />
                        <button
                          type="submit"
                          className="rounded-xl border border-border-strong px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-background"
                        >
                          Marcar como revisada
                        </button>
                      </form>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section id="help-resources" className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Recursos de autocontrol</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-background p-4">
              <p className="text-sm font-semibold text-foreground">Antes de registrar una nueva apuesta</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Revisa si tu stake actual sigue alineado con el presupuesto que definiste para hoy, esta semana y este mes.
              </p>
            </div>
            <div className="rounded-2xl bg-background p-4">
              <p className="text-sm font-semibold text-foreground">Si notas más impulso o frecuencia</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Considera activar una pausa voluntaria corta y volver a revisar la actividad con más distancia.
              </p>
            </div>
            <div className="rounded-2xl bg-background p-4">
              <p className="text-sm font-semibold text-foreground">Si quieres bajar exposición</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Reduce temporalmente el stake máximo por apuesta y ajusta tus límites para reforzar el autocontrol.
              </p>
            </div>
          </div>
        </section>
      </section>
    </AppLayout>
  );
}
