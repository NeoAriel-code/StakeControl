import "server-only";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@prisma/client";

/**
 * Checks if a user has admin privileges.
 * A user is considered an admin if:
 * 1. user.isAdmin is true in the database, OR
 * 2. Their email is included in the ADMIN_EMAILS environment variable (comma-separated list).
 */
export function isAdminUser(user: User | null | undefined): boolean {
  if (!user) return false;

  if (user.isAdmin) return true;

  const adminEmailsEnv = process.env.ADMIN_EMAILS || "";
  if (adminEmailsEnv) {
    const adminEmails = adminEmailsEnv.split(",").map((e) => e.trim().toLowerCase());
    if (adminEmails.includes(user.email.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Requires the current request user to be an admin.
 * If not authenticated, redirects to /login.
 * If authenticated but not admin, redirects to /dashboard.
 */
export async function requireAdminUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdminUser(user)) {
    redirect("/dashboard");
  }

  return user;
}
