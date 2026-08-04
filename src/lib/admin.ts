import "server-only";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@prisma/client";

/**
 * Checks if a user has admin privileges.
 * The database flag is the only source of truth for administrator access.
 */
export function isAdminUser(user: User | null | undefined): boolean {
  return user?.isAdmin === true;
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
