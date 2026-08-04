import "server-only";

import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getOpenAiFallbackLimit } from "@/lib/ai/ai-config";
import {
  AI_FAILURE_WINDOW_MS,
  AI_FAILURE_THRESHOLD,
  AI_HALF_OPEN_PROBES,
  getAiCircuitOpenUntil,
  shouldCloseAiCircuit,
  shouldOpenAiCircuit,
} from "@/lib/ai/ai-circuit";

const TASK = "ticket_extraction";
const PROVIDER = "deepseek";

export type DeepSeekCallDecision = {
  allowed: boolean;
  reason: "enabled" | "disabled" | "outside_rollout" | "circuit_open" | "probes_exhausted";
};

export async function assertEnabledAiProviderKeys() {
  await prisma.aIProviderConfiguration.updateMany({
    where: { task: TASK, provider: PROVIDER, OR: [{ enabled: true }, { rolloutPercentage: { gt: 0 } }] },
    data: { enabled: false, rolloutPercentage: 0, circuitState: "closed", openUntil: null },
  });
}

export async function shouldCallDeepSeek(betTicketImageId: string, now = new Date()): Promise<DeepSeekCallDecision> {
  void betTicketImageId;
  void now;
  return { allowed: false, reason: "disabled" };
  /* istanbul ignore next -- retained state machine for a future policy-reviewed release.
  const configuration = await prisma.aIProviderConfiguration.findUnique({
    where: { task_provider: { task: TASK, provider: PROVIDER } },
  });
  if (!configuration?.enabled || configuration.rolloutPercentage <= 0) return { allowed: false, reason: "disabled" };
  if (!isInStableRollout(betTicketImageId, configuration.rolloutPercentage)) return { allowed: false, reason: "outside_rollout" };

  if (configuration.circuitState === "open") {
    if (isAiCircuitStillOpen(configuration.openUntil, now)) return { allowed: false, reason: "circuit_open" };
    await prisma.aIProviderConfiguration.updateMany({
      where: { id: configuration.id, circuitState: "open", openUntil: { lte: now } },
      data: { circuitState: "half_open", halfOpenProbeCount: 0, halfOpenSuccessCount: 0 },
    });
  }

  const current = await prisma.aIProviderConfiguration.findUniqueOrThrow({ where: { id: configuration.id } });
  if (current.circuitState !== "half_open") return { allowed: true, reason: "enabled" };
  if (!canReserveAiProbe(current.halfOpenProbeCount)) return { allowed: false, reason: "probes_exhausted" };
  const reserved = await prisma.aIProviderConfiguration.updateMany({
    where: { id: current.id, circuitState: "half_open", halfOpenProbeCount: { lt: AI_HALF_OPEN_PROBES } },
    data: { halfOpenProbeCount: { increment: 1 } },
  });
  return reserved.count === 1
    ? { allowed: true, reason: "enabled" }
    : { allowed: false, reason: "probes_exhausted" };
  */
}

export async function recordDeepSeekSuccess() {
  const configuration = await prisma.aIProviderConfiguration.findUnique({
    where: { task_provider: { task: TASK, provider: PROVIDER } },
  });
  if (!configuration) return;

  if (configuration.circuitState === "half_open") {
    await prisma.aIProviderConfiguration.updateMany({
      where: { id: configuration.id, circuitState: "half_open" },
      data: { halfOpenSuccessCount: { increment: 1 } },
    });
    const current = await prisma.aIProviderConfiguration.findUniqueOrThrow({ where: { id: configuration.id } });
    if (current.circuitState === "half_open" && shouldCloseAiCircuit(current.halfOpenSuccessCount)) {
      await prisma.aIProviderConfiguration.updateMany({
        where: { id: configuration.id, circuitState: "half_open", halfOpenSuccessCount: { gte: AI_HALF_OPEN_PROBES } },
        data: {
          circuitState: "closed",
          failureWindowStartedAt: null,
          transientFailureCount: 0,
          openUntil: null,
          halfOpenProbeCount: 0,
          halfOpenSuccessCount: 0,
        },
      });
    }
  }
}

export async function recordDeepSeekFailure(options: { transient: boolean; openImmediately?: boolean }, now = new Date()) {
  const configuration = await prisma.aIProviderConfiguration.findUnique({
    where: { task_provider: { task: TASK, provider: PROVIDER } },
  });
  if (!configuration) return;

  const openCircuit = options.openImmediately || configuration.circuitState === "half_open";
  if (openCircuit) {
    await prisma.aIProviderConfiguration.update({
      where: { id: configuration.id },
      data: {
        circuitState: "open",
        openUntil: getAiCircuitOpenUntil(now),
        halfOpenProbeCount: 0,
        halfOpenSuccessCount: 0,
      },
    });
    return;
  }
  if (!options.transient) return;

  const cutoff = new Date(now.getTime() - AI_FAILURE_WINDOW_MS);
  const resetWindow = await prisma.aIProviderConfiguration.updateMany({
    where: {
      id: configuration.id,
      OR: [{ failureWindowStartedAt: null }, { failureWindowStartedAt: { lte: cutoff } }],
    },
    data: { failureWindowStartedAt: now, transientFailureCount: 1 },
  });
  if (resetWindow.count === 0) {
    await prisma.aIProviderConfiguration.update({
      where: { id: configuration.id },
      data: { transientFailureCount: { increment: 1 } },
    });
  }
  const current = await prisma.aIProviderConfiguration.findUniqueOrThrow({ where: { id: configuration.id } });
  if (shouldOpenAiCircuit(current.transientFailureCount)) {
    await prisma.aIProviderConfiguration.updateMany({
      where: { id: configuration.id, circuitState: "closed", transientFailureCount: { gte: AI_FAILURE_THRESHOLD } },
      data: {
        circuitState: "open",
        openUntil: getAiCircuitOpenUntil(now),
        halfOpenProbeCount: 0,
        halfOpenSuccessCount: 0,
      },
    });
  }
}

export async function reserveOpenAiTicketFallback() {
  const limit = getOpenAiFallbackLimit();
  if (limit === 0) return false;
  const result = await checkRateLimit({
    key: "ai-ticket-openai-fallback:global",
    limit,
    windowMs: 60_000,
  });
  return result.allowed;
}
