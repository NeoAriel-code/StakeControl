import { AppLayout } from "@/components/layout/AppLayout";
import { BetForm } from "@/components/bets/BetForm";
import { createBetAction } from "@/lib/bet-actions";
import { requireUser } from "@/lib/auth";
import { getPlanLabel, getUserPlan } from "@/lib/plans";
import prisma from "@/lib/prisma";
import { formatPauseMessage, isPauseActive } from "@/lib/responsible-gaming";

export default async function NewBetPage() {
  const user = await requireUser();
  const plan = await getUserPlan(user.id);
  const limits = await prisma.userLimits.findUnique({
    where: { userId: user.id },
  });
  const pauseIsActive = isPauseActive(limits?.pauseUntil);

  return (
    <AppLayout
      pageTitle="Registrar apuesta"
      userName={user.name || user.email}
      planLabel={getPlanLabel(plan)}
    >
      <section className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            Registro manual
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Nueva apuesta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Guarda la información de una apuesta de forma manual para seguimiento personal.
          </p>
        </div>

        {pauseIsActive ? (
          <div className="rounded-3xl border border-warning/30 bg-warning-soft p-6 shadow-sm">
            <p className="text-sm font-medium text-warning-foreground">
              {formatPauseMessage(limits!.pauseUntil!)}
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <BetForm
              action={createBetAction}
              submitIdleLabel="Guardar apuesta"
              submitPendingLabel="Guardando apuesta..."
              maxSingleStake={limits?.maxStakePerBet?.toString() ?? null}
            />
          </div>
        )}
      </section>
    </AppLayout>
  );
}
