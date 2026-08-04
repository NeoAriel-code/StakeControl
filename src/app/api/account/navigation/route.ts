import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json(
    { isAdmin: user?.isAdmin === true },
    { status: user ? 200 : 401, headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
