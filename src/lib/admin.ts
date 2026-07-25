import "server-only";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { User } from "@prisma/client";

const DEFAULT_ADMIN_EMAILS = [
  "arielalfaro.94@gmail.com",
  "aalfaro@stratechcorp.com",
];

/**
 * Checks if a user has admin privileges.
 * A user is considered an admin if:
 * 1. user.isAdmin is true in the database, OR
 * 2. Their email is in DEFAULT_ADMIN_EMAILS, OR
 * 3. Their email is included in the ADMIN_EMAILS environment variable.
 */
export function isAdminUser(user: User | null | undefined): boolean {
  if (!user || !user.email) return false;

  if (user.isAdmin) return true;

  const normalizedEmail = user.email.trim().toLowerCase();

  if (DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(normalizedEmail)) {
    return true;
  }

  const adminEmailsEnv = process.env.ADMIN_EMAILS || "";
  if (adminEmailsEnv) {
    const adminEmails = adminEmailsEnv.split(",").map((e) => e.trim().toLowerCase());
    if (adminEmails.includes(normalizedEmail)) {
      return true;
    }
  }

  return false;
}

/**
 * Requires the current request user to be an admin.
 * If not authenticated, redirects to /login.
 * If authenticated but not admin, redirects to /dashboard.
 * Automatically promotes matched admin emails in DB if not already flagged.
 */
export async function requireAdminUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdminUser(user)) {
    redirect("/dashboard");
  }

  // Ensure DB record has isAdmin set to true
  if (!user.isAdmin) {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { isAdmin: true },
      });
    } catch (err) {
      console.error("Error setting isAdmin flag in DB:", err);
    }
  }

  return user;
}
