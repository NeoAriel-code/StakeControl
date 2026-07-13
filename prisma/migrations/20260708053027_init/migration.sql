-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL DEFAULT '',
    "name" TEXT,
    "ageConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "termsAcceptedAt" DATETIME,
    "responsibleGamingAcceptedAt" DATETIME,
    "onboardingCompletedAt" DATETIME,
    "bankroll" DECIMAL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "timezone" TEXT NOT NULL DEFAULT 'America/Santiago',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("ageConfirmed", "bankroll", "createdAt", "currency", "email", "id", "name", "termsAcceptedAt", "timezone", "updatedAt") SELECT "ageConfirmed", "bankroll", "createdAt", "currency", "email", "id", "name", "termsAcceptedAt", "timezone", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
