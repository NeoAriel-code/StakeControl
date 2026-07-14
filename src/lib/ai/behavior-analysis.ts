import "server-only";

import type { AiProvider } from "@/lib/ai/ai-provider";
import { MockAiProvider } from "@/lib/ai/mock-ai-provider";
import { OpenAiProvider } from "@/lib/ai/openai-provider";
import { behaviorNarrativeJsonSchema, behaviorNarrativeSchema, type BehaviorNarrative } from "@/lib/ai/schemas/behavior-report.schema";
import { assertSafeAiOutput } from "@/lib/ai/safety-filter";

const SYSTEM_PROMPT = "Redacta un análisis exclusivamente histórico y preventivo. No recomiendes apuestas, mercados, selecciones, cuotas ni aumentar stakes. No predigas resultados ni prometas ganancias. Usa un tono prudente, menciona varianza y límites cuando proceda.";

function getProvider(): AiProvider {
  return process.env.AI_PROVIDER?.trim().toLowerCase() === "openai" ? new OpenAiProvider() : new MockAiProvider();
}

export async function generateBehaviorNarrative(input: Record<string, unknown>, fallback: BehaviorNarrative, provider = getProvider()) {
  if (provider instanceof MockAiProvider) return { narrative: fallback, model: "mock-v1", estimatedTokens: 0, fallbackUsed: false };
  const primaryModel = process.env.AI_REPORT_PRIMARY_MODEL || "gpt-5-mini";
  const fallbackModel = process.env.AI_REPORT_FALLBACK_MODEL || "gpt-5.6-terra";
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
