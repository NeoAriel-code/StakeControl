import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { User } from "@prisma/client";
import prisma from "@/lib/prisma";
export { getAuthSecret } from "./auth-secret-config";
import { getAuthSecret } from "./auth-secret-config";

const SESSION_COOKIE_NAME = "stakecontrol_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

type SessionPayload = {
  userId: string;
  exp: number;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signValue(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

function encodeSession(payload: SessionPayload) {
  const data = base64UrlEncode(JSON.stringify(payload));
  const signature = signValue(data);
  return `${data}.${signature}`;
}

function decodeSession(token: string): SessionPayload | null {
  const [data, signature] = token.split(".");

  if (!data || !signature) {
    return null;
  }

  const expectedSignature = signValue(data);
  const isValid =
    signature.length === expectedSignature.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (!isValid) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(data)) as SessionPayload;

    if (!payload.userId || typeof payload.exp !== "number") {
      return null;
    }

    if (payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  if (!passwordHash || !passwordHash.includes(":")) {
    return false;
  }

  const [salt, storedHash] = passwordHash.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const derivedHash = scryptSync(password, salt, 64).toString("hex");

  return (
    derivedHash.length === storedHash.length &&
    timingSafeEqual(Buffer.from(derivedHash), Buffer.from(storedHash))
  );
}

export function isOnboardingComplete(user: Pick<User, "ageConfirmed" | "termsAcceptedAt" | "responsibleGamingAcceptedAt">) {
  return Boolean(
    user.ageConfirmed &&
      user.termsAcceptedAt &&
      user.responsibleGamingAcceptedAt
  );
}

export function getPostAuthRedirect(user: Pick<User, "ageConfirmed" | "termsAcceptedAt" | "responsibleGamingAcceptedAt">) {
  return isOnboardingComplete(user) ? "/dashboard" : "/onboarding";
}

export async function createSession(userId: string) {
  const cookieStore = await cookies();
  const expires = Date.now() + SESSION_DURATION_MS;
  const token = encodeSession({ userId, exp: expires });

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expires),
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = decodeSession(token);
  return payload?.userId ?? null;
}

export async function getCurrentUser() {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
  });
}

type RequireUserOptions = {
  allowIncompleteOnboarding?: boolean;
};

export async function requireUser(options: RequireUserOptions = {}) {
  const { allowIncompleteOnboarding = false } = options;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!allowIncompleteOnboarding && !isOnboardingComplete(user)) {
    redirect("/onboarding");
  }

  return user;
}

export async function redirectAuthenticatedUser() {
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  redirect(getPostAuthRedirect(user));
}
