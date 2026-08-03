import http from "k6/http";
import { check } from "k6";
import { Rate, Trend } from "k6/metrics";

const applicationErrors = new Rate("application_errors");
const connectionErrors = new Rate("connection_errors");
const databaseDuration = new Trend("db_operation_duration", true);

export const options = {
  stages: [
    { duration: "2m", target: 250 },
    { duration: "10m", target: 250 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    application_errors: ["rate<0.01"],
    connection_errors: ["rate==0"],
    db_operation_duration: ["p(95)<200"],
  },
};

const baseUrl = (__ENV.PREVIEW_BASE_URL || "").replace(/\/$/, "");
const sessionCookie = __ENV.QA_SESSION_COOKIE || "";

function routeForMix(sample) {
  if (sample < 0.4) return "/dashboard";
  if (sample < 0.65) return "/health";
  if (sample < 0.85) return `/bets?page=${1 + Math.floor(Math.random() * 20)}`;
  if (sample < 0.95) return "/api/alerts/unread";
  return "/brand/stakecontrol-logo-horizontal.svg";
}

function recordDatabaseTiming(response) {
  const serverTiming = response.headers["Server-Timing"] || "";
  const match = serverTiming.match(/(?:^|,)\s*db(?:;[^,]*)?;dur=([0-9.]+)/i);
  if (match) databaseDuration.add(Number(match[1]));
}

export function setup() {
  if (!baseUrl || !sessionCookie) {
    throw new Error("PREVIEW_BASE_URL and QA_SESSION_COOKIE are required.");
  }
}

export default function runScenario() {
  const route = routeForMix(Math.random());
  const response = http.get(`${baseUrl}${route}`, {
    headers: { Cookie: sessionCookie },
    redirects: 0,
    tags: { route },
    timeout: "10s",
  });
  const connected = response.status !== 0;
  const succeeded = check(response, {
    "status is successful": (result) => result.status >= 200 && result.status < 300,
  });

  connectionErrors.add(!connected);
  applicationErrors.add(!succeeded);
  recordDatabaseTiming(response);
}
