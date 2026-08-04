import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HEALTH_TIMEOUT_MS = 2_000;
const responseHeaders = { "Cache-Control": "no-store" };

export async function GET() {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Database health check timed out.")), HEALTH_TIMEOUT_MS);
      }),
    ]);
    return NextResponse.json({ status: "ok" }, { status: 200, headers: responseHeaders });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503, headers: responseHeaders });
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
