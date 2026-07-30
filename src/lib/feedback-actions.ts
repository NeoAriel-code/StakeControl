"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { checkRateLimit, formatRateLimitMessage } from "@/lib/rate-limit";

export type ProductFeedbackActionState = { error?: string; success?: true; analytics?: { category: "error" | "confusing_feature" | "suggestion"; technical: boolean; contact: boolean } };

const categories = ["ERROR", "CONFUSING_FEATURE", "SUGGESTION"] as const;
const browserFamilies = ["Chrome", "Firefox", "Safari", "Edge", "Other"] as const;
const operatingSystems = ["Windows", "macOS", "Linux", "Android", "iOS", "Other"] as const;

const feedbackSchema = z.object({
  category: z.enum(categories),
  description: z.string().trim().min(10, "Describe el problema o sugerencia con al menos 10 caracteres.").max(2000),
  currentPath: z.string().trim().regex(/^\/[a-zA-Z0-9_./-]*$/, "La pantalla indicada no es válida.").max(200),
  includeTechnicalData: z.boolean(),
  contactPermission: z.boolean(),
  browser: z.enum(browserFamilies).optional(),
  operatingSystem: z.enum(operatingSystems).optional(),
  appVersion: z.string().trim().max(80).optional(),
});

function bool(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

/** Stores only a deliberately small, allow-listed technical context. */
export async function submitProductFeedbackAction(
  _prev: ProductFeedbackActionState,
  formData: FormData,
): Promise<ProductFeedbackActionState> {
  const user = await requireUser();
  const parsed = feedbackSchema.safeParse({
    category: formData.get("category"),
    description: formData.get("description"),
    currentPath: formData.get("currentPath"),
    includeTechnicalData: bool(formData, "includeTechnicalData"),
    contactPermission: bool(formData, "contactPermission"),
    browser: formData.get("browser") || undefined,
    operatingSystem: formData.get("operatingSystem") || undefined,
    appVersion: formData.get("appVersion") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "El feedback no es válido." };
  const limit = await checkRateLimit({ key: `product-feedback:${user.id}`, limit: 5, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) return { error: formatRateLimitMessage(limit.resetAt) };

  const input = parsed.data;
  const technicalData = input.includeTechnicalData
    ? { browser: input.browser ?? "Other", operatingSystem: input.operatingSystem ?? "Other", appVersion: input.appVersion ?? "unknown" }
    : undefined;
  await prisma.productFeedback.create({
    data: {
      category: input.category,
      description: input.description,
      currentPath: input.currentPath,
      technicalData,
      // Do not retain any account reference unless the person explicitly opted in to contact.
      contactUserId: input.contactPermission ? user.id : null,
    },
  });
  return { success: true, analytics: { category: input.category.toLowerCase() as "error" | "confusing_feature" | "suggestion", technical: input.includeTechnicalData, contact: input.contactPermission } };
}
