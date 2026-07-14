import "dotenv/config";
import { PrismaClient, Prisma, BetType, BetResult, AlertSeverity, AlertType, PlanType } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { randomBytes, scryptSync } from "node:crypto";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL,
  ...(process.env.TURSO_AUTH_TOKEN ? { authToken: process.env.TURSO_AUTH_TOKEN } : {}),
});

const prisma = new PrismaClient({ adapter });

function decimal(value) {
  return new Prisma.Decimal(value);
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const demoEmail = "demo@stakecontrol.app";

  await prisma.aIExtraction.deleteMany();
  await prisma.betTicketImage.deleteMany();
  await prisma.responsibleGamingAlert.deleteMany();
  await prisma.monthlyReport.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.userLimits.deleteMany();
  await prisma.bet.deleteMany();
  await prisma.user.deleteMany({
    where: { email: demoEmail },
  });

  const demoUser = await prisma.user.create({
    data: {
      email: demoEmail,
      passwordHash: hashPassword("Demo12345!"),
      name: "StakeControl Demo",
      ageConfirmed: true,
      termsAcceptedAt: new Date("2026-07-08T12:00:00.000Z"),
      responsibleGamingAcceptedAt: new Date("2026-07-08T12:00:00.000Z"),
      onboardingCompletedAt: new Date("2026-07-08T12:00:00.000Z"),
      bankroll: decimal("1500.00"),
      currency: "USD",
      timezone: "America/Santiago",
      limits: {
        create: {
          dailyStakeLimit: decimal("50.00"),
          weeklyStakeLimit: decimal("250.00"),
          monthlyStakeLimit: decimal("800.00"),
          maxStakePerBet: decimal("25.00"),
          monthlyLossLimit: decimal("300.00"),
          pauseUntil: null,
          pauseAllBetting: false,
        },
      },
      subscriptions: {
        create: {
          planType: PlanType.FREE,
          status: "active",
          startedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      },
    },
  });

  const betsData = [
    ["Real Madrid vs Barcelona", BetType.SINGLE, BetResult.WON, "20.00", "1.95", "39.00", "19.00", "2026-07-01T18:00:00.000Z", "2026-07-01T20:00:00.000Z"],
    ["Lakers Moneyline", BetType.SINGLE, BetResult.LOST, "15.00", "2.10", "0.00", "-15.00", "2026-07-02T01:00:00.000Z", "2026-07-02T03:30:00.000Z"],
    ["Parlay Champions", BetType.COMBO, BetResult.WON, "10.00", "4.50", "45.00", "35.00", "2026-07-02T16:00:00.000Z", "2026-07-02T22:00:00.000Z"],
    ["Tennis Set 2", BetType.SINGLE, BetResult.LOST, "12.50", "1.80", "0.00", "-12.50", "2026-07-03T14:20:00.000Z", "2026-07-03T15:15:00.000Z"],
    ["Copa América Under 2.5", BetType.SINGLE, BetResult.PENDING, "18.00", "1.72", null, null, "2026-07-04T23:00:00.000Z", null],
    ["MLB Yankees Runline", BetType.SINGLE, BetResult.CASHOUT, "25.00", "2.25", "28.00", "3.00", "2026-07-05T00:10:00.000Z", "2026-07-05T02:00:00.000Z"],
    ["System 2/3 Picks", BetType.SYSTEM, BetResult.VOID, "16.00", "3.20", "16.00", "0.00", "2026-07-05T10:00:00.000Z", "2026-07-05T19:00:00.000Z"],
    ["UFC Main Event", BetType.SINGLE, BetResult.LOST, "22.00", "1.66", "0.00", "-22.00", "2026-07-06T03:00:00.000Z", "2026-07-06T03:20:00.000Z"],
    ["ATP Quarterfinal", BetType.SINGLE, BetResult.WON, "14.00", "2.40", "33.60", "19.60", "2026-07-06T12:00:00.000Z", "2026-07-06T14:40:00.000Z"],
    ["Ticket pendiente de revisar", BetType.SINGLE, BetResult.PENDING, "8.00", "1.10", null, null, "2026-07-07T18:15:00.000Z", null],
  ];

  const createdBets = [];

  for (const [title, betType, result, stake, odds, settledPayout, profitLoss, placedAt, settledAt] of betsData) {
    const bet = await prisma.bet.create({
      data: {
        userId: demoUser.id,
        title,
        sportsbook: "DemoBook",
        currency: "USD",
        ticketCode: null,
        sport: "Football",
        market: "Demo Market",
        selection: title,
        betType,
        result,
        stake: decimal(stake),
        odds: decimal(odds),
        potentialPayout: decimal((Number(stake) * Number(odds)).toFixed(2)),
        settledPayout: settledPayout ? decimal(settledPayout) : null,
        profitLoss: profitLoss ? decimal(profitLoss) : null,
        placedAt: new Date(placedAt),
        settledAt: settledAt ? new Date(settledAt) : null,
      },
    });

    createdBets.push(bet);
  }

  const firstImage = await prisma.betTicketImage.create({
    data: {
      userId: demoUser.id,
      betId: createdBets[0].id,
      imageUrl: "https://example.com/tickets/demo-ticket-1.jpg",
      fileName: "demo-ticket-1.jpg",
      mimeType: "image/jpeg",
      fileSizeBytes: 248190,
      aiExtraction: {
        create: {
          provider: "openai",
          model: "gpt-4.1-mini",
          confidence: decimal("0.9425"),
          rawText: "Real Madrid vs Barcelona - Stake 20.00 - Odds 1.95",
          extractedData: {
            title: createdBets[0].title,
            stake: "20.00",
            odds: "1.95",
            result: "WON",
          },
        },
      },
    },
  });

  await prisma.betTicketImage.create({
    data: {
      userId: demoUser.id,
      betId: createdBets[2].id,
      imageUrl: "https://example.com/tickets/demo-ticket-2.jpg",
      fileName: "demo-ticket-2.jpg",
      mimeType: "image/jpeg",
      fileSizeBytes: 198552,
    },
  });

  await prisma.responsibleGamingAlert.createMany({
    data: [
      {
        userId: demoUser.id,
        type: AlertType.LIMIT_APPROACHING,
        severity: AlertSeverity.MEDIUM,
        title: "Límite semanal cerca",
        message: "Has usado el 84% de tu límite semanal de stake.",
        metadata: { usageRatio: 0.84 },
      },
      {
        userId: demoUser.id,
        type: AlertType.LOSS_STREAK,
        severity: AlertSeverity.HIGH,
        title: "Racha negativa detectada",
        message: "Llevas 3 apuestas consecutivas perdidas. Considera pausar.",
        metadata: { streak: 3 },
      },
      {
        userId: demoUser.id,
        type: AlertType.PAUSE_RECOMMENDED,
        severity: AlertSeverity.HIGH,
        title: "Pausa recomendada",
        message: "Tu frecuencia reciente aumentó respecto del promedio del mes.",
        metadata: { weeklyBets: 9, monthlyAverageWeeklyBets: 5 },
      },
    ],
  });

  await prisma.monthlyReport.create({
    data: {
      userId: demoUser.id,
      year: 2026,
      month: 7,
      totalBets: createdBets.length,
      totalStake: decimal("160.50"),
      totalProfit: decimal("27.10"),
      roi: decimal("0.1688"),
      hitRate: decimal("0.4000"),
      netUnits: decimal("1.36"),
      generatedAt: new Date("2026-07-08T12:00:00.000Z"),
    },
  });

  console.log(`Seed complete for ${demoEmail}`);
  console.log(`Created ${createdBets.length} bets and AI extraction ${firstImage.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
