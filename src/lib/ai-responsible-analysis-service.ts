import "server-only";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { assertResponsibleAnalysisOutput } from "@/lib/ai-responsible-output-filter";
import { generateBehaviorNarrative } from "@/lib/ai/behavior-analysis";
import { checkRateLimit, formatRateLimitMessage } from "@/lib/rate-limit";

export const AI_RESPONSIBLE_ANALYSIS_PROMPT_VERSION = "responsible-analysis-v1";

export const AI_RESPONSIBLE_ANALYSIS_SAFE_PROMPT = `
Genera un informe preventivo basado solo en datos históricos del usuario.
Reglas estrictas:
- No recomendar apuestas, mercados, selecciones, cuotas ni aumento de stake.
- No prometer ganancias, seguridad, recuperacion de perdidas ni ventajas futuras.
- Usar lenguaje historico, prudente y de autocontrol.
- Incluir advertencias de varianza, muestra pequeña y límites cuando corresponda.
- El objetivo es reducir riesgo, revisar limites o pausar temporalmente, no optimizar apuestas.
`;

type AnalysisBet = {
  id: string;
  sport: string | null;
  market: string | null;
  result: string;
  stake: number;
  profitLoss: number;
  placedAt: Date;
};

export type AnalysisCategory = {
  name: string;
  betCount: number;
  stake: number;
  exposurePct: number;
  profitLoss: number;
  roi: number;
};

export type AiResponsibleAnalysisReport = {
  periodLabel: string;
  year: number;
  month: number;
  generatedAt: string;
  summary: string;
  totalBets: number;
  resolvedBets: number;
  totalStake: number;
  totalProfit: number;
  roi: number;
  averageStake: number;
  stakeVariationPct: number;
  previousAverageStake: number;
  betsPerWeek: number;
  activeDays: number;
  currentWinningStreak: number;
  currentLosingStreak: number;
  maxWinningStreak: number;
  maxLosingStreak: number;
  topExposureCategories: AnalysisCategory[];
  worstHistoricalCategories: AnalysisCategory[];
  bestHistoricalCategories: AnalysisCategory[];
  warnings: string[];
  preventiveMessages: string[];
};

function round(value: number, decimals = 2) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Number(value.toFixed(decimals));
}

function safeDivide(numerator: number, denominator: number) {
  if (!denominator) {
    return 0;
  }

  return numerator / denominator;
}

function getMonthBounds(referenceDate = new Date()) {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);
  const previousStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);

  return { start, end, previousStart };
}

function getPeriodLabel(date: Date) {
  return new Intl.DateTimeFormat("es-CL", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function isResolvedResult(result: string) {
  return result !== "PENDING" && result !== "UNKNOWN";
}

function buildCategoryName(bet: AnalysisBet) {
  const sport = bet.sport?.trim() || "Sin deporte";
  const market = bet.market?.trim() || "Sin mercado";
  return `${sport} / ${market}`;
}

function buildCategories(bets: AnalysisBet[]) {
  const totalStake = bets.reduce((sum, bet) => sum + bet.stake, 0);
  const grouped = new Map<string, { betCount: number; stake: number; profitLoss: number }>();

  for (const bet of bets) {
    const name = buildCategoryName(bet);
    const current = grouped.get(name) ?? { betCount: 0, stake: 0, profitLoss: 0 };

    grouped.set(name, {
      betCount: current.betCount + 1,
      stake: current.stake + bet.stake,
      profitLoss: current.profitLoss + bet.profitLoss,
    });
  }

  return Array.from(grouped.entries()).map(([name, category]) => ({
    name,
    betCount: category.betCount,
    stake: round(category.stake),
    exposurePct: round(safeDivide(category.stake, totalStake) * 100),
    profitLoss: round(category.profitLoss),
    roi: round(safeDivide(category.profitLoss, category.stake) * 100),
  }));
}

function buildCurrentStreak(bets: AnalysisBet[], targetResult: "WON" | "LOST") {
  const resolved = [...bets]
    .filter((bet) => bet.result === "WON" || bet.result === "LOST")
    .sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime());

  let streak = 0;

  for (const bet of resolved) {
    if (bet.result !== targetResult) {
      break;
    }

    streak += 1;
  }

  return streak;
}

function buildMaxStreak(bets: AnalysisBet[], targetResult: "WON" | "LOST") {
  const resolved = [...bets]
    .filter((bet) => bet.result === "WON" || bet.result === "LOST")
    .sort((a, b) => a.placedAt.getTime() - b.placedAt.getTime());

  let current = 0;
  let max = 0;

  for (const bet of resolved) {
    if (bet.result === targetResult) {
      current += 1;
      max = Math.max(max, current);
      continue;
    }

    current = 0;
  }

  return max;
}

export function filterResponsibleAnalysisOutput(report: AiResponsibleAnalysisReport) {
  assertResponsibleAnalysisOutput(report);
  return report;
}

function buildSummary({
  totalBets,
  totalStake,
  totalProfit,
  stakeVariationPct,
  betsPerWeek,
}: {
  totalBets: number;
  totalStake: number;
  totalProfit: number;
  stakeVariationPct: number;
  betsPerWeek: number;
}) {
  const profitPhrase =
    totalProfit < 0
      ? "resultado neto negativo"
      : totalProfit > 0
        ? "resultado neto positivo"
        : "resultado neto neutro";

  const variationPhrase =
    stakeVariationPct > 0
      ? `un aumento de ${round(stakeVariationPct)}% en el stake promedio frente al mes anterior`
      : stakeVariationPct < 0
        ? `una reduccion de ${Math.abs(round(stakeVariationPct))}% en el stake promedio frente al mes anterior`
        : "un stake promedio estable frente al mes anterior";

  return `En tus datos históricos del mes se registran ${totalBets} apuestas, un gasto total de ${round(
    totalStake
  )}, ${profitPhrase}, ${variationPhrase} y una frecuencia aproximada de ${round(
    betsPerWeek
  )} apuestas por semana. Esto puede estar influido por muestra pequeña o varianza.`;
}

function buildPreventiveMessages(report: Pick<AiResponsibleAnalysisReport, "stakeVariationPct" | "currentLosingStreak" | "totalProfit">) {
  const messages = [
    "No se recomienda aumentar el stake automáticamente.",
    "Considera revisar tus límites.",
  ];

  if (report.stakeVariationPct > 25 || report.currentLosingStreak >= 3 || report.totalProfit < 0) {
    messages.push("Podrías reducir exposición o pausar temporalmente.");
  }

  return messages;
}

export class AiResponsibleAnalysisService {
  async generateMonthlyReport(userId: string, referenceDate = new Date()) {
    const rateLimit = checkRateLimit({
      key: `ai-analysis:${userId}`,
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      throw new Error(formatRateLimitMessage(rateLimit.resetAt));
    }

    const { start, end, previousStart } = getMonthBounds(referenceDate);

    const [monthBetsRaw, previousMonthBetsRaw, historicalBetsRaw] = await Promise.all([
      prisma.bet.findMany({
        where: {
          userId,
          placedAt: {
            gte: start,
            lt: end,
          },
        },
        orderBy: { placedAt: "asc" },
      }),
      prisma.bet.findMany({
        where: {
          userId,
          placedAt: {
            gte: previousStart,
            lt: start,
          },
        },
      }),
      prisma.bet.findMany({
        where: { userId },
        orderBy: { placedAt: "asc" },
      }),
    ]);

    const monthBets = monthBetsRaw.map(toAnalysisBet);
    const previousMonthBets = previousMonthBetsRaw.map(toAnalysisBet);
    const historicalBets = historicalBetsRaw.map(toAnalysisBet);
    const totalBets = monthBets.length;
    const resolvedBets = monthBets.filter((bet) => isResolvedResult(bet.result));
    const totalStake = round(monthBets.reduce((sum, bet) => sum + bet.stake, 0));
    const totalProfit = round(monthBets.reduce((sum, bet) => sum + bet.profitLoss, 0));
    const averageStake = round(safeDivide(totalStake, totalBets));
    const previousAverageStake = round(
      safeDivide(
        previousMonthBets.reduce((sum, bet) => sum + bet.stake, 0),
        previousMonthBets.length
      )
    );
    const stakeVariationPct = round(
      previousAverageStake > 0
        ? safeDivide(averageStake - previousAverageStake, previousAverageStake) * 100
        : 0
    );
    const activeDays = new Set(monthBets.map((bet) => bet.placedAt.toISOString().slice(0, 10))).size;
    const daysInPeriod = Math.max(1, Math.ceil((Math.min(Date.now(), end.getTime()) - start.getTime()) / 86_400_000));
    const betsPerWeek = round(safeDivide(totalBets, daysInPeriod) * 7);
    const historicalCategories = buildCategories(historicalBets);
    const monthCategories = buildCategories(monthBets);

    const report: AiResponsibleAnalysisReport = {
      periodLabel: getPeriodLabel(start),
      year: start.getFullYear(),
      month: start.getMonth() + 1,
      generatedAt: new Date().toISOString(),
      summary: buildSummary({
        totalBets,
        totalStake,
        totalProfit,
        stakeVariationPct,
        betsPerWeek,
      }),
      totalBets,
      resolvedBets: resolvedBets.length,
      totalStake,
      totalProfit,
      roi: round(safeDivide(totalProfit, totalStake) * 100),
      averageStake,
      stakeVariationPct,
      previousAverageStake,
      betsPerWeek,
      activeDays,
      currentWinningStreak: buildCurrentStreak(historicalBets, "WON"),
      currentLosingStreak: buildCurrentStreak(historicalBets, "LOST"),
      maxWinningStreak: buildMaxStreak(historicalBets, "WON"),
      maxLosingStreak: buildMaxStreak(historicalBets, "LOST"),
      topExposureCategories: [...monthCategories].sort((a, b) => b.stake - a.stake).slice(0, 5),
      worstHistoricalCategories: [...historicalCategories]
        .filter((category) => category.betCount >= 2)
        .sort((a, b) => a.roi - b.roi)
        .slice(0, 5),
      bestHistoricalCategories: [...historicalCategories]
        .filter((category) => category.betCount >= 2)
        .sort((a, b) => b.roi - a.roi)
        .slice(0, 5),
      warnings: totalBets < 30 ? ["Esto puede estar influido por muestra pequeña o varianza."] : [],
      preventiveMessages: [],
    };

    report.preventiveMessages = buildPreventiveMessages(report);

    const aiNarrative = await generateBehaviorNarrative(
      {
        periodLabel: report.periodLabel,
        totalBets: report.totalBets,
        resolvedBets: report.resolvedBets,
        totalStake: report.totalStake,
        totalProfit: report.totalProfit,
        roi: report.roi,
        averageStake: report.averageStake,
        stakeVariationPct: report.stakeVariationPct,
        betsPerWeek: report.betsPerWeek,
        currentLosingStreak: report.currentLosingStreak,
        warnings: report.warnings,
      },
      {
        summary: report.summary,
        preventiveMessages: report.preventiveMessages,
        warnings: report.warnings,
      }
    );
    report.summary = aiNarrative.narrative.summary;
    report.preventiveMessages = aiNarrative.narrative.preventiveMessages;
    report.warnings = aiNarrative.narrative.warnings;

    const safeReport = filterResponsibleAnalysisOutput(report);
    const analysisData = {
      ...safeReport,
      aiMetadata: {
        model: aiNarrative.model,
        estimatedTokens: aiNarrative.estimatedTokens,
        fallbackUsed: aiNarrative.fallbackUsed,
      },
    };

    await prisma.monthlyReport.upsert({
      where: {
        userId_year_month: {
          userId,
          year: safeReport.year,
          month: safeReport.month,
        },
      },
      create: {
        userId,
        year: safeReport.year,
        month: safeReport.month,
        totalBets: safeReport.totalBets,
        totalStake: new Prisma.Decimal(safeReport.totalStake),
        totalProfit: new Prisma.Decimal(safeReport.totalProfit),
        roi: new Prisma.Decimal(safeReport.roi),
        hitRate: new Prisma.Decimal(safeDivide(
          resolvedBets.filter((bet) => bet.result === "WON").length,
          resolvedBets.length
        ) * 100),
        netUnits: new Prisma.Decimal(safeDivide(safeReport.totalProfit, safeReport.averageStake)),
        analysisData: analysisData as unknown as Prisma.InputJsonValue,
        safePromptVersion: AI_RESPONSIBLE_ANALYSIS_PROMPT_VERSION,
        analysisGeneratedAt: new Date(safeReport.generatedAt),
      },
      update: {
        totalBets: safeReport.totalBets,
        totalStake: new Prisma.Decimal(safeReport.totalStake),
        totalProfit: new Prisma.Decimal(safeReport.totalProfit),
        roi: new Prisma.Decimal(safeReport.roi),
        hitRate: new Prisma.Decimal(safeDivide(
          resolvedBets.filter((bet) => bet.result === "WON").length,
          resolvedBets.length
        ) * 100),
        netUnits: new Prisma.Decimal(safeDivide(safeReport.totalProfit, safeReport.averageStake)),
        analysisData: analysisData as unknown as Prisma.InputJsonValue,
        safePromptVersion: AI_RESPONSIBLE_ANALYSIS_PROMPT_VERSION,
        analysisGeneratedAt: new Date(safeReport.generatedAt),
        generatedAt: new Date(safeReport.generatedAt),
      },
    });

    return safeReport;
  }
}

export async function generateResponsibleBehaviorReport(userId: string, period = new Date()) {
  return new AiResponsibleAnalysisService().generateMonthlyReport(userId, period);
}

function toAnalysisBet(bet: {
  id: string;
  sport: string | null;
  market: string | null;
  result: string;
  stake: Prisma.Decimal;
  profitLoss: Prisma.Decimal | null;
  placedAt: Date;
}): AnalysisBet {
  return {
    id: bet.id,
    sport: bet.sport,
    market: bet.market,
    result: bet.result,
    stake: Number(bet.stake),
    profitLoss: bet.profitLoss ? Number(bet.profitLoss) : 0,
    placedAt: bet.placedAt,
  };
}
