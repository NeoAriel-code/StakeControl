const PUBLIC_HOST = "www.getstakecontrol.com";
const APP_HOST = "app.getstakecontrol.com";
const LEGACY_VERCEL_HOST = "stakecontrol.vercel.app";

const APPLICATION_PATHS = [
  "/alerts",
  "/analysis",
  "/bets",
  "/beta-terms",
  "/dashboard",
  "/forgot-password",
  "/health",
  "/limits",
  "/login",
  "/onboarding",
  "/profile",
  "/register",
  "/reportes",
  "/reports",
  "/reset-password",
  "/settings",
  "/tickets",
  "/upgrade",
  "/verify-email",
];

const PUBLIC_PATHS = new Set(["/", "/privacy", "/terms", "/terminos"]);

function normalizeHost(host: string) {
  return host.split(",")[0]?.trim().toLowerCase().replace(/:\d+$/, "") ?? "";
}

function isApplicationPath(pathname: string) {
  return APPLICATION_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function getHostRedirect(host: string, pathname: string, search: string) {
  const normalizedHost = normalizeHost(host);
  const suffix = `${pathname}${search}`;

  if (normalizedHost === LEGACY_VERCEL_HOST) {
    return `https://${isApplicationPath(pathname) ? APP_HOST : PUBLIC_HOST}${suffix}`;
  }

  if (
    (normalizedHost === PUBLIC_HOST || normalizedHost === "getstakecontrol.com") &&
    isApplicationPath(pathname)
  ) {
    return `https://${APP_HOST}${suffix}`;
  }

  if (normalizedHost === APP_HOST && PUBLIC_PATHS.has(pathname)) {
    return `https://${PUBLIC_HOST}${suffix}`;
  }

  return null;
}
