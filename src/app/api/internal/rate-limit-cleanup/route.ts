import { NextResponse } from "next/server";
import { cleanupExpiredRateLimitBuckets } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await cleanupExpiredRateLimitBuckets();
  return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
