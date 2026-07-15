"use server";

import { AlertSeverity, AlertType, BetResult, BetType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { evaluateResponsibleGamingAlerts } from "@/lib/responsible-gaming";
import { canUseDemoData } from "@/lib/demo-access";

const DEMO_TICKET_PREFIX = "DEMO-STC";

type DemoBetSeed = {
  daysAgo: number;
  sportsbook: string;
  sport: string;
  league: string;
  market: string;
  selection: string;
  stake: number;
  odds: number;
  result: BetResult;
};

const DEMO_BETS: DemoBetSeed[] = [
  { daysAgo: 1, sportsbook: "Bet365", sport: "Fútbol", league: "Premier League", market: "Resultado", selection: "Arsenal", stake: 12000, odds: 1.82, result: BetResult.LOST },
  { daysAgo: 2, sportsbook: "Betano", sport: "Fútbol", league: "La Liga", market: "Ambos anotan", selection: "Sí", stake: 15000, odds: 1.75, result: BetResult.LOST },
  { daysAgo: 3, sportsbook: "Coolbet", sport: "Tenis", league: "ATP", market: "Ganador partido", selection: "Jugador A", stake: 10000, odds: 2.1, result: BetResult.LOST },
  { daysAgo: 4, sportsbook: "Bet365", sport: "Basket", league: "NBA", market: "Total puntos", selection: "Over 218.5", stake: 18000, odds: 1.9, result: BetResult.LOST },
  { daysAgo: 5, sportsbook: "Betano", sport: "Fútbol", league: "Serie A", market: "Doble oportunidad", selection: "Local o empate", stake: 9000, odds: 1.42, result: BetResult.WON },
  { daysAgo: 6, sportsbook: "Bet365", sport: "Fútbol", league: "Champions League", market: "Resultado", selection: "Empate", stake: 11000, odds: 3.2, result: BetResult.LOST },
  { daysAgo: 7, sportsbook: "Coolbet", sport: "Tenis", league: "WTA", market: "Total games", selection: "Under 21.5", stake: 8000, odds: 1.88, result: BetResult.WON },
  { daysAgo: 8, sportsbook: "Bet365", sport: "Fútbol", league: "Premier League", market: "Corners", selection: "Over 9.5", stake: 14000, odds: 1.95, result: BetResult.WON },
  { daysAgo: 9, sportsbook: "Betano", sport: "Fútbol", league: "Primera División Chile", market: "Resultado", selection: "Colo-Colo", stake: 16000, odds: 1.7, result: BetResult.LOST },
  { daysAgo: 10, sportsbook: "Bet365", sport: "Basket", league: "NBA", market: "Handicap", selection: "Local -4.5", stake: 13000, odds: 1.91, result: BetResult.WON },
  { daysAgo: 11, sportsbook: "Coolbet", sport: "Fútbol", league: "Copa Libertadores", market: "Ambos anotan", selection: "No", stake: 9000, odds: 1.83, result: BetResult.LOST },
  { daysAgo: 12, sportsbook: "Bet365", sport: "Fútbol", league: "La Liga", market: "Resultado", selection: "Barcelona", stake: 11000, odds: 1.65, result: BetResult.WON },
  { daysAgo: 13, sportsbook: "Betano", sport: "Tenis", league: "ATP", market: "Ganador set 1", selection: "Jugador B", stake: 7000, odds: 2.05, result: BetResult.LOST },
  { daysAgo: 14, sportsbook: "Bet365", sport: "Fútbol", league: "Premier League", market: "Total goles", selection: "Over 2.5", stake: 12500, odds: 1.78, result: BetResult.WON },
  { daysAgo: 15, sportsbook: "Coolbet", sport: "Basket", league: "Euroliga", market: "Total puntos", selection: "Under 160.5", stake: 9500, odds: 1.87, result: BetResult.WON },
  { daysAgo: 16, sportsbook: "Betano", sport: "Fútbol", league: "Serie A", market: "Resultado", selection: "Inter", stake: 13500, odds: 1.72, result: BetResult.LOST },
  { daysAgo: 17, sportsbook: "Bet365", sport: "Fútbol", league: "Bundesliga", market: "Ambos anotan", selection: "Sí", stake: 12000, odds: 1.69, result: BetResult.WON },
  { daysAgo: 18, sportsbook: "Coolbet", sport: "Tenis", league: "ATP", market: "Ganador partido", selection: "Jugador C", stake: 8500, odds: 1.96, result: BetResult.WON },
  { daysAgo: 19, sportsbook: "Bet365", sport: "Fútbol", league: "Premier League", market: "Resultado", selection: "Liverpool", stake: 14000, odds: 1.8, result: BetResult.LOST },
  { daysAgo: 20, sportsbook: "Betano", sport: "Basket", league: "NBA", market: "Jugador puntos", selection: "Over 24.5", stake: 10000, odds: 1.86, result: BetResult.LOST },
  { daysAgo: 21, sportsbook: "Bet365", sport: "Fútbol", league: "Champions League", market: "Total goles", selection: "Under 3.5", stake: 11500, odds: 1.55, result: BetResult.WON },
  { daysAgo: 22, sportsbook: "Coolbet", sport: "Fútbol", league: "Primera División Chile", market: "Resultado", selection: "Universidad de Chile", stake: 9000, odds: 2.25, result: BetResult.WON },
  { daysAgo: 23, sportsbook: "Betano", sport: "Tenis", league: "WTA", market: "Ganador partido", selection: "Jugadora A", stake: 8000, odds: 1.74, result: BetResult.LOST },
  { daysAgo: 24, sportsbook: "Bet365", sport: "Fútbol", league: "La Liga", market: "Handicap", selection: "Local -1", stake: 13000, odds: 2.02, result: BetResult.WON },
  { daysAgo: 25, sportsbook: "Coolbet", sport: "Basket", league: "NBA", market: "Total puntos", selection: "Over 224.5", stake: 9500, odds: 1.9, result: BetResult.LOST },
  { daysAgo: 26, sportsbook: "Bet365", sport: "Fútbol", league: "Premier League", market: "Corners", selection: "Under 10.5", stake: 10500, odds: 1.82, result: BetResult.WON },
  { daysAgo: 27, sportsbook: "Betano", sport: "Fútbol", league: "Serie A", market: "Ambos anotan", selection: "Sí", stake: 11500, odds: 1.77, result: BetResult.LOST },
  { daysAgo: 28, sportsbook: "Bet365", sport: "Tenis", league: "ATP", market: "Total games", selection: "Over 22.5", stake: 7000, odds: 2.0, result: BetResult.WON },
  { daysAgo: 29, sportsbook: "Coolbet", sport: "Fútbol", league: "Copa Libertadores", market: "Resultado", selection: "Local", stake: 15000, odds: 1.88, result: BetResult.WON },
  { daysAgo: 30, sportsbook: "Bet365", sport: "Basket", league: "NBA", market: "Handicap", selection: "Visitante +6.5", stake: 10000, odds: 1.91, result: BetResult.LOST },
  { daysAgo: 31, sportsbook: "Betano", sport: "Fútbol", league: "Premier League", market: "Resultado", selection: "Manchester City", stake: 14000, odds: 1.62, result: BetResult.WON },
  { daysAgo: 32, sportsbook: "Bet365", sport: "Fútbol", league: "La Liga", market: "Total goles", selection: "Over 2.5", stake: 12000, odds: 1.84, result: BetResult.WON },
  { daysAgo: 33, sportsbook: "Coolbet", sport: "Tenis", league: "ATP", market: "Ganador partido", selection: "Jugador D", stake: 8500, odds: 1.93, result: BetResult.LOST },
  { daysAgo: 34, sportsbook: "Bet365", sport: "Fútbol", league: "Bundesliga", market: "Resultado", selection: "Bayern", stake: 16000, odds: 1.5, result: BetResult.WON },
  { daysAgo: 35, sportsbook: "Betano", sport: "Basket", league: "NBA", market: "Total puntos", selection: "Under 230.5", stake: 9000, odds: 1.88, result: BetResult.WON },
  { daysAgo: 36, sportsbook: "Bet365", sport: "Fútbol", league: "Primera División Chile", market: "Ambos anotan", selection: "Sí", stake: 10000, odds: 1.8, result: BetResult.LOST },
];

function decimal(value: number) {
  return new Prisma.Decimal(value.toFixed(2));
}

function profitLossFor(seed: DemoBetSeed) {
  if (seed.result === BetResult.WON) {
    return seed.stake * (seed.odds - 1);
  }

  if (seed.result === BetResult.LOST) {
    return -seed.stake;
  }

  return 0;
}

export async function createDemoDataAction() {
  const user = await requireUser();

  if (!canUseDemoData(user.email)) {
    throw new Error("La carga de datos demo solo está disponible para cuentas QA autorizadas.");
  }
  const existingDemoBet = await prisma.bet.findFirst({
    where: {
      userId: user.id,
      ticketCode: {
        startsWith: DEMO_TICKET_PREFIX,
      },
    },
    select: { id: true },
  });

  if (existingDemoBet) {
    redirect("/health?demo=exists");
  }

  const now = new Date();
  const currency = user.currency || "USD";

  await prisma.$transaction(async (tx) => {
    await tx.userLimits.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        dailyStakeLimit: decimal(35000),
        weeklyStakeLimit: decimal(120000),
        monthlyStakeLimit: decimal(420000),
        maxStakePerBet: decimal(20000),
      },
      update: {
        dailyStakeLimit: decimal(35000),
        weeklyStakeLimit: decimal(120000),
        monthlyStakeLimit: decimal(420000),
        maxStakePerBet: decimal(20000),
      },
    });

    await tx.bet.createMany({
      data: DEMO_BETS.map((seed, index) => {
        const placedAt = new Date(now);
        placedAt.setDate(now.getDate() - seed.daysAgo);
        placedAt.setHours(20 - (index % 5), 15, 0, 0);
        const profitLoss = profitLossFor(seed);

        return {
          userId: user.id,
          title: `${seed.sport} · ${seed.market}`,
          sportsbook: seed.sportsbook,
          ticketCode: `${DEMO_TICKET_PREFIX}-${String(index + 1).padStart(3, "0")}`,
          sport: seed.sport,
          league: seed.league,
          market: seed.market,
          selection: seed.selection,
          currency,
          betType: index % 6 === 0 ? BetType.COMBO : BetType.SINGLE,
          result: seed.result,
          stake: decimal(seed.stake),
          odds: decimal(seed.odds),
          potentialPayout: decimal(seed.stake * seed.odds),
          settledPayout: seed.result === BetResult.WON ? decimal(seed.stake * seed.odds) : null,
          profitLoss: decimal(profitLoss),
          placedAt,
          settledAt: seed.result === BetResult.PENDING ? null : placedAt,
          notes: "Registro demo generado para probar métricas, alertas y salud de juego.",
        };
      }),
    });

    await tx.responsibleGamingAlert.createMany({
      data: [
        {
          userId: user.id,
          type: AlertType.LOSS_STREAK,
          severity: AlertSeverity.HIGH,
          title: "Racha reciente de pérdidas",
          message:
            "Se registró una racha reciente de pérdidas consecutivas. Considera revisar tus límites o tomar una pausa temporal.",
          metadata: { source: "demo" },
        },
        {
          userId: user.id,
          type: AlertType.LIMIT_APPROACHING,
          severity: AlertSeverity.MEDIUM,
          title: "Límite semanal cerca de alcanzarse",
          message:
            "Estás cerca de tu límite semanal. No se recomienda aumentar el stake automáticamente.",
          metadata: { source: "demo" },
        },
      ],
    });
  });

  await evaluateResponsibleGamingAlerts(user.id);

  revalidatePath("/dashboard");
  revalidatePath("/health");
  revalidatePath("/bets");
  revalidatePath("/alerts");
  revalidatePath("/limits");

  redirect("/health?demo=created");
}
