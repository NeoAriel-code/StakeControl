import type { Metadata } from "next";
import Link from "next/link";
import { Crown, FileText, Settings, ShieldCheck, SlidersHorizontal, UserCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { ProfilePreferencesForm } from "@/components/settings/ProfilePreferencesForm";
import { EmailNotificationPreferencesForm } from "@/components/settings/EmailNotificationPreferencesForm";
import { buildNotificationPreferences } from "@/lib/notification-preferences";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getPlanLabel, getUserPlan } from "@/lib/plans";
import { parsePreferredSports } from "@/lib/sports";

export const metadata: Metadata = {
  title: "Configuración | StakeControl",
  description: "Preferencias de cuenta, seguridad, límites, plan y documentos legales.",
};

export default async function SettingsPage() {
  const user = await requireUser();
  const plan = await getUserPlan(user.id);
  const notificationPreferences = await prisma.notificationPreferences.findUnique({ where: { userId: user.id } });

  return (
    <AppLayout
      pageTitle="Configuración"
      userName={user.name || user.email}
      planLabel={getPlanLabel(plan)}
      plan={plan}
    >
      <section className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Configuración"
          description="Administra tu perfil, seguridad y preferencias de visualización."
          icon={Settings}
          breadcrumb="StakeControl"
        />

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <UserCircle size={22} className="mt-1 text-primary" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Perfil y visualización</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajusta cómo ves tu información dentro de StakeControl.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <ProfilePreferencesForm
              defaultValues={{
                name: user.name ?? "",
                country: user.country ?? "OTHER",
                currency: user.currency,
                timezone: user.timezone,
                oddsFormat: user.oddsFormat,
                preferredSports: parsePreferredSports(user.preferredSports),
              }}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Alertas por email</h2>
          <p className="mt-1 text-sm text-muted-foreground">Elige qué alertas preventivas quieres recibir.</p>
          <div className="mt-6"><EmailNotificationPreferencesForm preferences={notificationPreferences ?? buildNotificationPreferences(false)} /></div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck size={22} className="mt-1 text-secondary" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Seguridad</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Cambia tu contraseña usando tu contraseña actual como confirmación.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <ChangePasswordForm />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Link
            href="/limits"
            className="rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:bg-background"
          >
            <SlidersHorizontal size={22} className="text-warning" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Límites y pausas</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ajusta límites diarios, semanales, mensuales y pausas voluntarias.
            </p>
          </Link>

          <Link
            href="/upgrade"
            className="rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:bg-background"
          >
            <Crown size={22} className="text-primary" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Plan</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Revisa tu plan actual y las funciones disponibles para Free y Premium.
            </p>
          </Link>

          <Link
            href="/profile"
            className="rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:bg-background"
          >
            <UserCircle size={22} className="text-secondary" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Cuenta</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Revisa datos de perfil, uso OCR y eliminación de cuenta.
            </p>
          </Link>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <FileText size={22} className="text-success" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Privacidad y términos</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/privacy"
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold transition hover:bg-background"
              >
                Privacidad
              </Link>
              <Link
                href="/terms"
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold transition hover:bg-background"
              >
                Términos
              </Link>
            </div>
          </div>
        </section>
      </section>
    </AppLayout>
  );
}
