import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { buildBetsCsv } from "@/lib/bet-csv-export";
import { canUseFeature, getHistoryCutoffDate, getUserPlan } from "@/lib/plans";
import prisma from "@/lib/prisma";

function parseDateParam(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getExclusiveEndDate(value: string | null) {
  const date = parseDateParam(value);

  if (!date) {
    return null;
  }

  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

function buildFilename(from: string | null, to: string | null) {
  const suffix = [from, to].filter(Boolean).join("_");
  return suffix ? `stakecontrol-bets-${suffix}.csv` : "stakecontrol-bets.csv";
}

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const startDate = parseDateParam(from);
  const endDate = getExclusiveEndDate(to);
  const [plan, hasFullHistory] = await Promise.all([
    getUserPlan(user.id),
    canUseFeature(user.id, "history_full"),
  ]);
  const historyCutoff = getHistoryCutoffDate();
  const placedAt = {
    ...(startDate ? { gte: hasFullHistory ? startDate : new Date(Math.max(startDate.getTime(), historyCutoff.getTime())) } : {}),
    ...(endDate ? { lt: endDate } : {}),
    ...(!startDate && !hasFullHistory ? { gte: historyCutoff } : {}),
  };

  const bets = await prisma.bet.findMany({
    where: {
      userId: user.id,
      ...(Object.keys(placedAt).length ? { placedAt } : {}),
    },
    orderBy: { placedAt: "desc" },
    include: {
      ticketImages: {
        select: {
          aiExtraction: {
            select: {
              confidence: true,
            },
          },
        },
      },
    },
  });

  const csv = buildBetsCsv(
    bets.map((bet) => ({
      ...bet,
      stake: bet.stake.toString(),
      odds: bet.odds.toString(),
      profitLoss: bet.profitLoss?.toString() ?? null,
      ticketImages: bet.ticketImages.map((ticketImage) => ({
        aiExtraction: ticketImage.aiExtraction
          ? {
              confidence: ticketImage.aiExtraction.confidence?.toString() ?? null,
            }
          : null,
      })),
    })),
    plan
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${buildFilename(from, to)}"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
