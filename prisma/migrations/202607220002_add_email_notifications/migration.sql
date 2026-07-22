CREATE TABLE "NotificationPreferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "emailAlertsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "limitApproachingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "limitExceededEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stakeIncreaseEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lossStreakEnabled" BOOLEAN NOT NULL DEFAULT false,
    "highFrequencyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pauseRecommendedEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "NotificationPreferences_userId_key" ON "NotificationPreferences"("userId");

CREATE TABLE "EmailDelivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "alertId" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "providerMessageId" TEXT,
    "failureReason" TEXT,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmailDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmailDelivery_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "ResponsibleGamingAlert" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "EmailDelivery_dedupeKey_key" ON "EmailDelivery"("dedupeKey");
CREATE INDEX "EmailDelivery_userId_createdAt_idx" ON "EmailDelivery"("userId", "createdAt");
CREATE INDEX "EmailDelivery_alertId_idx" ON "EmailDelivery"("alertId");
