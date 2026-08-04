CREATE TABLE "AIProviderConfiguration" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "task" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "rolloutPercentage" INTEGER NOT NULL DEFAULT 0,
  "circuitState" TEXT NOT NULL DEFAULT 'closed',
  "failureWindowStartedAt" DATETIME,
  "transientFailureCount" INTEGER NOT NULL DEFAULT 0,
  "openUntil" DATETIME,
  "halfOpenProbeCount" INTEGER NOT NULL DEFAULT 0,
  "halfOpenSuccessCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "AIProviderConfiguration_task_provider_key"
  ON "AIProviderConfiguration"("task", "provider");
CREATE INDEX "AIProviderConfiguration_task_enabled_idx"
  ON "AIProviderConfiguration"("task", "enabled");

INSERT INTO "AIProviderConfiguration" (
  "id", "task", "provider", "enabled", "rolloutPercentage", "circuitState", "updatedAt"
) VALUES (
  'ticket-extraction-deepseek', 'ticket_extraction', 'deepseek', false, 0, 'closed', CURRENT_TIMESTAMP
);
