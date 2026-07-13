import type { StatusBadgeKind } from "@/components/ui/StatusBadge";

type ExposureItem = {
  name: string;
  exposurePct: number;
};

type LimitUsage = {
  current: number;
  limit?: number | null;
};

export type HealthSignal = {
  id: string;
  title: string;
  description: string;
  severity: "good" | "info" | "warning" | "danger";
  actionLabel?: string;
  actionHref?: string;
};

export type ResponsibleHealthInput = {
  betCount: number;
  currentLosingStreak: number;
  sportExposure: ExposureItem[];
  marketExposure: ExposureItem[];
  dailyLimit: LimitUsage;
  weeklyLimit: LimitUsage;
  monthlyLimit: LimitUsage;
  pauseActive: boolean;
  unreadAlertCount: number;
  highSeverityAlertCount: number;
};

export type ResponsibleHealth = {
  score: number;
  status: StatusBadgeKind;
  title: string;
  summary: string;
  signals: HealthSignal[];
};

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function limitRatio(limit: LimitUsage) {
  if (!limit.limit || limit.limit <= 0) {
    return null;
  }

  return limit.current / limit.limit;
}

function hasConfiguredLimit(limit: LimitUsage) {
  return Boolean(limit.limit && limit.limit > 0);
}

function buildLimitSignal(id: string, label: string, ratio: number | null): HealthSignal | null {
  if (ratio === null) {
    return {
      id,
      title: `${label} sin configurar`,
      description: "Configurar límites ayuda a detectar cambios de ritmo antes de que sean difíciles de revisar.",
      severity: "info",
      actionLabel: "Configurar límites",
      actionHref: "/limits",
    };
  }

  if (ratio >= 1) {
    return {
      id,
      title: `${label} superado`,
      description: "Considera revisar tus límites o activar una pausa temporal antes de seguir registrando actividad.",
      severity: "danger",
      actionLabel: "Revisar límites",
      actionHref: "/limits",
    };
  }

  if (ratio >= 0.8) {
    return {
      id,
      title: `${label} cerca del máximo`,
      description: "Estás cerca de un límite personal. No se recomienda aumentar el stake automáticamente.",
      severity: "warning",
      actionLabel: "Ver límites",
      actionHref: "/limits",
    };
  }

  return null;
}

export function calculateResponsibleHealth(input: ResponsibleHealthInput): ResponsibleHealth {
  let score = 100;
  const signals: HealthSignal[] = [];

  const dailyRatio = limitRatio(input.dailyLimit);
  const weeklyRatio = limitRatio(input.weeklyLimit);
  const monthlyRatio = limitRatio(input.monthlyLimit);
  const ratios = [dailyRatio, weeklyRatio, monthlyRatio].filter((ratio): ratio is number => ratio !== null);
  const exceededLimit = ratios.some((ratio) => ratio >= 1);
  const nearLimit = ratios.some((ratio) => ratio >= 0.8 && ratio < 1);
  const configuredLimits = [input.dailyLimit, input.weeklyLimit, input.monthlyLimit].filter(hasConfiguredLimit).length;

  if (input.pauseActive) {
    score -= 35;
    signals.push({
      id: "pause-active",
      title: "Pausa activa",
      description: "La pausa voluntaria está bloqueando nuevos registros. Mantén esta decisión si te ayuda a tomar distancia.",
      severity: "warning",
      actionLabel: "Ver pausa",
      actionHref: "/limits",
    });
  }

  for (const signal of [
    buildLimitSignal("daily-limit", "Límite diario", dailyRatio),
    buildLimitSignal("weekly-limit", "Límite semanal", weeklyRatio),
    buildLimitSignal("monthly-limit", "Límite mensual", monthlyRatio),
  ]) {
    if (!signal) continue;
    signals.push(signal);
    if (signal.severity === "danger") score -= 24;
    if (signal.severity === "warning") score -= 14;
  }

  if (configuredLimits === 0) {
    score -= 10;
  } else if (configuredLimits < 3) {
    score -= 4;
  }

  if (input.currentLosingStreak >= 4) {
    score -= 18;
    signals.push({
      id: "loss-streak",
      title: `${input.currentLosingStreak} pérdidas consecutivas`,
      description: "Esto puede estar influido por muestra pequeña o varianza. Podrías reducir exposición o pausar temporalmente.",
      severity: "danger",
      actionLabel: "Revisar límites",
      actionHref: "/limits",
    });
  } else if (input.currentLosingStreak >= 2) {
    score -= 8;
    signals.push({
      id: "loss-streak-watch",
      title: "Racha negativa reciente",
      description: "En tus datos históricos aparece una racha de pérdidas. Considera revisar tus límites.",
      severity: "warning",
    });
  }

  const topSport = input.sportExposure[0];
  const topMarket = input.marketExposure[0];

  if (topSport && topSport.exposurePct >= 60) {
    score -= 10;
    signals.push({
      id: "sport-concentration",
      title: `Alta exposición en ${topSport.name}`,
      description: `${topSport.exposurePct.toFixed(0)}% del stake histórico está concentrado en un deporte. Podrías reducir exposición o pausar temporalmente.`,
      severity: "warning",
      actionLabel: "Ver historial",
      actionHref: "/bets",
    });
  }

  if (topMarket && topMarket.exposurePct >= 55) {
    score -= 8;
    signals.push({
      id: "market-concentration",
      title: `Alta exposición en ${topMarket.name}`,
      description: "La concentración por mercado puede esconder patrones difíciles de notar apuesta por apuesta.",
      severity: "warning",
      actionLabel: "Ver historial",
      actionHref: "/bets",
    });
  }

  if (input.highSeverityAlertCount > 0) {
    score -= input.highSeverityAlertCount * 10;
    signals.push({
      id: "high-alerts",
      title: "Alertas de alta prioridad pendientes",
      description: "Tienes alertas preventivas sin revisar. Considera leerlas antes de seguir registrando actividad.",
      severity: "danger",
      actionLabel: "Ver alertas",
      actionHref: "/alerts",
    });
  } else if (input.unreadAlertCount > 0) {
    score -= 5;
    signals.push({
      id: "unread-alerts",
      title: "Alertas pendientes",
      description: "Hay señales preventivas no leídas en tu cuenta.",
      severity: "info",
      actionLabel: "Ver alertas",
      actionHref: "/alerts",
    });
  }

  if (input.betCount < 10) {
    score -= 5;
    signals.push({
      id: "small-sample",
      title: "Historial todavía pequeño",
      description: "Esto puede estar influido por muestra pequeña o varianza. Registra más historial antes de sacar conclusiones.",
      severity: "info",
    });
  }

  if (signals.length === 0) {
    signals.push({
      id: "stable",
      title: "Sin señales preventivas relevantes",
      description: "Tus límites y patrones recientes no muestran alertas fuertes con los datos actuales.",
      severity: "good",
    });
  }

  const finalScore = clampScore(score);
  const status: StatusBadgeKind = input.pauseActive
    ? "pause-active"
    : exceededLimit
      ? "limit-exceeded"
      : finalScore < 65 || input.highSeverityAlertCount > 0
        ? "review-required"
        : nearLimit || finalScore < 82
          ? "near-limit"
          : "controlled";

  const title =
    status === "controlled"
      ? "Actividad bajo control"
      : status === "near-limit"
        ? "Conviene revisar límites"
        : status === "limit-exceeded"
          ? "Límite superado"
          : status === "pause-active"
            ? "Pausa activa"
            : "Revisión requerida";

  const summary =
    status === "controlled"
      ? "En tus datos históricos no aparecen señales fuertes de riesgo en este momento."
      : "En tus datos históricos aparecen señales que conviene revisar con calma antes de seguir registrando actividad.";

  return {
    score: finalScore,
    status,
    title,
    summary,
    signals,
  };
}
