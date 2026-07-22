import { NextResponse, type NextRequest } from "next/server";
import { getHostRedirect } from "@/lib/host-routing";

export function proxy(request: NextRequest) {
  const redirect = getHostRedirect(
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "",
    request.nextUrl.pathname,
    request.nextUrl.search
  );

  return redirect ? NextResponse.redirect(new URL(redirect)) : NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest).*)"],
};
