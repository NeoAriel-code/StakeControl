ALTER TABLE "EmailDelivery" ADD COLUMN "recipientHash" TEXT;
ALTER TABLE "EmailDelivery" ADD COLUMN "lastEvent" TEXT;
ALTER TABLE "EmailDelivery" ADD COLUMN "deliveredAt" DATETIME;
ALTER TABLE "EmailDelivery" ADD COLUMN "bouncedAt" DATETIME;
ALTER TABLE "EmailDelivery" ADD COLUMN "complainedAt" DATETIME;
ALTER TABLE "EmailDelivery" ADD COLUMN "failedAt" DATETIME;
ALTER TABLE "EmailDelivery" ADD COLUMN "delayedAt" DATETIME;

CREATE UNIQUE INDEX "EmailDelivery_providerMessageId_key" ON "EmailDelivery"("providerMessageId");
CREATE INDEX "EmailDelivery_recipientHash_idx" ON "EmailDelivery"("recipientHash");

CREATE TABLE "EmailWebhookEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "providerEventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "providerMessageId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "EmailWebhookEvent_providerEventId_key" ON "EmailWebhookEvent"("providerEventId");
CREATE INDEX "EmailWebhookEvent_providerMessageId_idx" ON "EmailWebhookEvent"("providerMessageId");

CREATE TABLE "RestrictedEmailAddress" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "emailHash" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "RestrictedEmailAddress_emailHash_key" ON "RestrictedEmailAddress"("emailHash");

CREATE TABLE "AccountSecurityAlert" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "deliveryId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "occurredAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountSecurityAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AccountSecurityAlert_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "EmailDelivery" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AccountSecurityAlert_deliveryId_key" ON "AccountSecurityAlert"("deliveryId");
CREATE INDEX "AccountSecurityAlert_userId_occurredAt_idx" ON "AccountSecurityAlert"("userId", "occurredAt");
