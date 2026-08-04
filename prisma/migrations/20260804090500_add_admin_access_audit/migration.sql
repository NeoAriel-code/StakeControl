CREATE TABLE "AdminAccessAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "administratorId" TEXT NOT NULL,
    "affectedUserId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "action" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAccessAudit_administratorId_fkey" FOREIGN KEY ("administratorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AdminAccessAudit_affectedUserId_fkey" FOREIGN KEY ("affectedUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AdminAccessAudit_administratorId_createdAt_idx" ON "AdminAccessAudit"("administratorId", "createdAt");
CREATE INDEX "AdminAccessAudit_affectedUserId_createdAt_idx" ON "AdminAccessAudit"("affectedUserId", "createdAt");
CREATE INDEX "AdminAccessAudit_resource_resourceId_createdAt_idx" ON "AdminAccessAudit"("resource", "resourceId", "createdAt");
