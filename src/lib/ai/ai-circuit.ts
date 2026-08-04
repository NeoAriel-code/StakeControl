export const AI_FAILURE_WINDOW_MS = 60_000;
export const AI_CIRCUIT_OPEN_MS = 120_000;
export const AI_FAILURE_THRESHOLD = 20;
export const AI_HALF_OPEN_PROBES = 5;

export function shouldOpenAiCircuit(transientFailureCount: number) {
  return transientFailureCount >= AI_FAILURE_THRESHOLD;
}

export function getAiCircuitOpenUntil(now: Date) {
  return new Date(now.getTime() + AI_CIRCUIT_OPEN_MS);
}

export function isAiCircuitStillOpen(openUntil: Date | null, now: Date) {
  return !openUntil || openUntil > now;
}

export function canReserveAiProbe(probeCount: number) {
  return probeCount < AI_HALF_OPEN_PROBES;
}

export function shouldCloseAiCircuit(successCount: number) {
  return successCount >= AI_HALF_OPEN_PROBES;
}
