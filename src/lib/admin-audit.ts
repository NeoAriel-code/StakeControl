import "server-only";

import prisma from "@/lib/prisma";

export type AdminContentResource = "ticket" | "bet";

export async function recordAdminContentAccess(input: {
  administratorId: string;
  affectedUserId: string;
  resource: AdminContentResource;
  resourceId: string;
  action?: "view" | "download";
}) {
  return prisma.adminAccessAudit.create({
    data: {
      administratorId: input.administratorId,
      affectedUserId: input.affectedUserId,
      resource: input.resource,
      resourceId: input.resourceId,
      action: input.action ?? "view",
    },
  });
}
