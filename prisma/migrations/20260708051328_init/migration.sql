-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "ageConfirmed" BOOLEAN NOT NULL,
    "termsAcceptedAt" DATETIME NOT NULL,
    "bankroll" DECIMAL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "timezone" TEXT NOT NULL DEFAULT 'America/Santiago',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Bet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sportsbook" TEXT,
    "sport" TEXT,
    "league" TEXT,
    "market" TEXT,
    "selection" TEXT,
    "betType" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "result" TEXT NOT NULL DEFAULT 'PENDING',
    "stake" DECIMAL NOT NULL,
    "odds" DECIMAL NOT NULL,
    "potentialPayout" DECIMAL,
    "settledPayout" DECIMAL,
    "profitLoss" DECIMAL,
    "placedAt" DATETIME NOT NULL,
    "settledAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BetTicketImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "betId" TEXT,
    "imageUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BetTicketImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BetTicketImage_betId_fkey" FOREIGN KEY ("betId") REFERENCES "Bet" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIExtraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "betTicketImageId" TEXT NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "confidence" DECIMAL,
    "rawText" TEXT,
    "extractedData" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIExtraction_betTicketImageId_fkey" FOREIGN KEY ("betTicketImageId") REFERENCES "BetTicketImage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserLimits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dailyStakeLimit" DECIMAL,
    "weeklyStakeLimit" DECIMAL,
    "monthlyStakeLimit" DECIMAL,
    "maxStakePerBet" DECIMAL,
    "monthlyLossLimit" DECIMAL,
    "coolingOffUntil" DATETIME,
    "pauseAllBetting" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserLimits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResponsibleGamingAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "acknowledgedAt" DATETIME,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResponsibleGamingAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planType" TEXT NOT NULL DEFAULT 'FREE',
    "status" TEXT NOT NULL DEFAULT 'active',
    "externalCustomerId" TEXT,
    "externalSubId" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodStart" DATETIME,
    "currentPeriodEnd" DATETIME,
    "canceledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MonthlyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "totalBets" INTEGER NOT NULL DEFAULT 0,
    "totalStake" DECIMAL NOT NULL DEFAULT 0,
    "totalProfit" DECIMAL NOT NULL DEFAULT 0,
    "roi" DECIMAL NOT NULL DEFAULT 0,
    "hitRate" DECIMAL,
    "netUnits" DECIMAL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MonthlyReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Bet_userId_placedAt_idx" ON "Bet"("userId", "placedAt");

-- CreateIndex
CREATE INDEX "Bet_userId_result_idx" ON "Bet"("userId", "result");

-- CreateIndex
CREATE INDEX "BetTicketImage_userId_uploadedAt_idx" ON "BetTicketImage"("userId", "uploadedAt");

-- CreateIndex
CREATE INDEX "BetTicketImage_betId_idx" ON "BetTicketImage"("betId");

-- CreateIndex
CREATE UNIQUE INDEX "AIExtraction_betTicketImageId_key" ON "AIExtraction"("betTicketImageId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLimits_userId_key" ON "UserLimits"("userId");

-- CreateIndex
CREATE INDEX "ResponsibleGamingAlert_userId_createdAt_idx" ON "ResponsibleGamingAlert"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ResponsibleGamingAlert_userId_severity_idx" ON "ResponsibleGamingAlert"("userId", "severity");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- CreateIndex
CREATE INDEX "MonthlyReport_userId_year_month_idx" ON "MonthlyReport"("userId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyReport_userId_year_month_key" ON "MonthlyReport"("userId", "year", "month");
