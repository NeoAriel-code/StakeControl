import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import prisma from "@/lib/prisma";

const updateSchema = z.object({
  enabled: z.boolean(),
  rolloutPercentage: z.number().int().min(0).max(100),
});

async function authorize() {
  const user = await getCurrentUser();
  return isAdminUser(user) ? user : null;
}

export async function GET() {
  if (!await authorize()) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const configuration = await prisma.aIProviderConfiguration.findUnique({
    where: { task_provider: { task: "ticket_extraction", provider: "deepseek" } },
    select: {
      enabled: true,
      rolloutPercentage: true,
      circuitState: true,
      transientFailureCount: true,
      openUntil: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({
    ...(configuration ?? {
      circuitState: "closed",
      transientFailureCount: 0,
      openUntil: null,
    }),
    enabled: false,
    rolloutPercentage: 0,
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  if (!await authorize()) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Configuración inválida" }, { status: 400 });
  if (parsed.data.enabled || parsed.data.rolloutPercentage > 0) {
    return NextResponse.json({ error: "DeepSeek permanece deshabilitado durante esta beta." }, { status: 409 });
  }

  const configuration = await prisma.aIProviderConfiguration.upsert({
    where: { task_provider: { task: "ticket_extraction", provider: "deepseek" } },
    create: {
      task: "ticket_extraction",
      provider: "deepseek",
      enabled: false,
      rolloutPercentage: 0,
    },
    update: {
      enabled: false,
      rolloutPercentage: 0,
      ...({
        circuitState: "closed",
        openUntil: null,
        halfOpenProbeCount: 0,
        halfOpenSuccessCount: 0,
      }),
    },
    select: { enabled: true, rolloutPercentage: true, circuitState: true, openUntil: true },
  });
  return NextResponse.json(configuration, { headers: { "Cache-Control": "private, no-store" } });
}
