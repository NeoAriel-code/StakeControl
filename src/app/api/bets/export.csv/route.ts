import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canUseFeature, getHistoryCutoffDate } from "@/lib/plans";
import prisma from "@/lib/prisma";

function escapeCsv(value: string | null | undefined) {
  const normalized = value ?? "";
  return `"${normalized.replace(/"/g, '""')}"`;
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const hasFullHistory = await canUseFeature(user.id, "history_full");
  const bets = await prisma.bet.findMany({
    where: {
      userId: user.id,
      ...(hasFullHistory ? {} : { placedAt: { gte: getHistoryCutoffDate() } }),
    },
    orderBy: { placedAt: "desc" },
  });

  const header = [
    "fecha",
    "evento",
    "sportsbook",
    "deporte",
    "mercado",
    "seleccion",
    "stake",
    "moneda",
    "cuota",
    "resultado",
  ];

  const lines = bets.map((bet) =>
    [
      bet.placedAt.toISOString(),
      bet.title,
      bet.sportsbook,
      bet.sport,
      bet.market,
      bet.selection,
      bet.stake.toString(),
      bet.currency,
      bet.odds.toString(),
      bet.result,
    ]
      .map((value) => escapeCsv(value))
      .join(",")
  );

  const csv = [header.join(","), ...lines].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="stakecontrol-bets.csv"',
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
