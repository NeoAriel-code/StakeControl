ALTER TABLE "Bet" ADD COLUMN "creationKey" TEXT;

CREATE UNIQUE INDEX "Bet_userId_creationKey_key" ON "Bet"("userId", "creationKey");
