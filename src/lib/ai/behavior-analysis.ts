import "server-only";

import type { AiProvider } from "@/lib/ai/ai-provider";
import { MockAiProvider } from "@/lib/ai/mock-ai-provider";
import { createConfiguredAiProvider } from "@/lib/ai/ai-provider-factory";
import { getAiModelConfig } from "@/lib/ai/ai-config";
import { behaviorNarrativeJsonSchema, behaviorNarrativeSchema, type BehaviorNarrative } from "@/lib/ai/schemas/behavior-report.schema";
import { assertSafeAiOutput } from "@/lib/ai/safety-filter";

const SYSTEM_PROMPT = "Redacta un análisis exclusivamente histórico y preventivo. No recomiendes apuestas, mercados, selecciones, cuotas ni aumentar stakes. No predigas resultados ni prometas ganancias. Usa un tono prudente, menciona varianza y límites cuando proceda.";

function getProvider(): AiProvider {
  return createConfiguredAiProvider();
}

export async function generateBehaviorNarrative(input: Record<string, unknown>, fallback: BehaviorNarrative, provider = getProvider()) {
  if (provider instanceof MockAiProvider) return { narrative: fallback, model: "mock-v1", estimatedTokens: 0, fallbackUsed: false };
  const { reportPrimary: primaryModel, reportFallback: fallbackModel } = getAiModelConfig();
  const request = (model: string) => provider.generateStructured({ task: "behavior_analysis", model, system: SYSTEM_PROMPT, prompt: `Datos agregados históricos, sin identificadores personales:\n${JSON.stringify(input)}`, schemaName: "behavior_report", jsonSchema: behaviorNarrativeJsonSchema });
  try {
    const primary = await request(primaryModel);
    const narrative = behaviorNarrativeSchema.parse(primary.data);
    assertSafeAiOutput(narrative);
    return { narrative, model: primary.model, estimatedTokens: primary.estimatedTokens, fallbackUsed: false };
  } catch {
    const fallbackResponse = await request(fallbackModel);
    const narrative = behaviorNarrativeSchema.parse(fallbackResponse.data);
    assertSafeAiOutput(narrative);
    return { narrative, model: fallbackResponse.model, estimatedTokens: fallbackResponse.estimatedTokens, fallbackUsed: true };
  }
}
