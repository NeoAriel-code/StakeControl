import { notFound, redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { BetForm } from "@/components/bets/BetForm";
import { updateBetAction } from "@/lib/bet-actions";
import { requireUser } from "@/lib/auth";
import { canUseFeature, getHistoryCutoffDate, getPlanLabel, getUserPlan } from "@/lib/plans";
import prisma from "@/lib/prisma";

type EditBetPageProps = {
  params: Promise<{ id: string }>;
};

function toDateTimeLocal(date: Date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

export default async function EditBetPage({ params }: EditBetPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const [hasFullHistory, plan] = await Promise.all([
    canUseFeature(user.id, "history_full"),
    getUserPlan(user.id),
  ]);

  const bet = await prisma.bet.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!bet) {
    notFound();
  }

  if (!hasFullHistory && bet.placedAt < getHistoryCutoffDate()) {
    redirect("/upgrade");
  }

  const limits = await prisma.userLimits.findUnique({
    where: { userId: user.id },
  });

  return (
    <AppLayout
      pageTitle="Editar apuesta"
      userName={user.name || user.email}
      planLabel={getPlanLabel(plan)}
      plan={plan}
    >
      <section className="mx-auto max-w-4xl space-y-6">
        <div className="surface-panel p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            Edición
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Editar apuesta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ajusta los datos guardados para mantener el historial consistente.
          </p>
        </div>

        <div className="form-panel p-6">
          <BetForm
            action={updateBetAction.bind(null, bet.id)}
            submitIdleLabel="Guardar cambios"
            submitPendingLabel="Guardando cambios..."
            maxSingleStake={limits?.maxStakePerBet?.toString() ?? null}
            defaultValues={{
              sportsbook: bet.sportsbook,
              placedAt: toDateTimeLocal(bet.placedAt),
              event: bet.title,
              sport: bet.sport,
              league: bet.league,
              market: bet.market,
              selection: bet.selection,
              betType: bet.betType,
              stake: bet.stake.toString(),
              odds: bet.odds.toString(),
              currency: bet.currency,
              potentialPayout: bet.potentialPayout?.toString(),
              result: bet.result,
              netProfit: bet.profitLoss?.toString() ?? "0",
              ticketCode: bet.ticketCode,
              notes: bet.notes,
            }}
          />
        </div>
      </section>
    </AppLayout>
  );
}
