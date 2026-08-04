ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- Previous versions mirrored voluntary pauses into pauseAllBetting. From this
-- migration onward pauseAllBetting is reserved for indefinite admin suspension.
UPDATE "UserLimits"
SET "pauseAllBetting" = false
WHERE "pauseUntil" IS NOT NULL;
