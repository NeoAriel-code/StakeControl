-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sportsbook" TEXT,
    "ticketCode" TEXT,
    "sport" TEXT,
    "league" TEXT,
    "market" TEXT,
    "selection" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "currencySource" TEXT,
    "betType" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "result" TEXT NOT NULL DEFAULT 'PENDING',
    "stake" DECIMAL NOT NULL,
    "odds" DECIMAL NOT NULL,
    "potentialPayout" DECIMAL,
    "settledPayout" DECIMAL,
    "profitLoss" DECIMAL,
    "placedAt" DATETIME,
    "placedAtSource" TEXT,
    "eventStartAt" DATETIME,
    "eventStartAtSource" TEXT,
    "settledAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Bet" (
    "id", "userId", "title", "description", "sportsbook", "ticketCode", "sport", "league", "market", "selection",
    "currency", "currencySource", "betType", "result", "stake", "odds", "potentialPayout", "settledPayout", "profitLoss",
    "placedAt", "placedAtSource", "settledAt", "notes", "createdAt", "updatedAt"
)
SELECT
    "id", "userId", "title", "description", "sportsbook", "ticketCode", "sport", "league", "market", "selection",
    "currency", CASE WHEN "currency" IS NOT NULL THEN 'UNKNOWN' ELSE NULL END, "betType", "result", "stake", "odds", "potentialPayout", "settledPayout", "profitLoss",
    "placedAt", CASE WHEN "placedAt" IS NOT NULL THEN 'UNKNOWN' ELSE NULL END, "settledAt", "notes", "createdAt", "updatedAt"
FROM "Bet";
DROP TABLE "Bet";
ALTER TABLE "new_Bet" RENAME TO "Bet";
CREATE INDEX "Bet_userId_placedAt_idx" ON "Bet"("userId", "placedAt");
CREATE INDEX "Bet_userId_result_idx" ON "Bet"("userId", "result");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
