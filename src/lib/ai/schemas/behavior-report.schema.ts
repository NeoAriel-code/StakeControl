import { z } from "zod";

export const behaviorNarrativeSchema = z.object({
  summary: z.string().min(1),
  preventiveMessages: z.array(z.string().min(1)).max(5),
  warnings: z.array(z.string().min(1)).max(5),
});

export type BehaviorNarrative = z.infer<typeof behaviorNarrativeSchema>;

export const behaviorNarrativeJsonSchema = {
  type: "object", additionalProperties: false, required: ["summary", "preventiveMessages", "warnings"],
  properties: { summary: { type: "string" }, preventiveMessages: { type: "array", items: { type: "string" } }, warnings: { type: "array", items: { type: "string" } } },
} as const;
