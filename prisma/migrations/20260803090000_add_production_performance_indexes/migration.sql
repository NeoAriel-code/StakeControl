CREATE INDEX "Bet_userId_result_placedAt_idx"
ON "Bet"("userId", "result", "placedAt" DESC);

CREATE INDEX "ResponsibleGamingAlert_userId_acknowledgedAt_createdAt_idx"
ON "ResponsibleGamingAlert"("userId", "acknowledgedAt", "createdAt" DESC);

CREATE INDEX "Subscription_userId_status_createdAt_idx"
ON "Subscription"("userId", "status", "createdAt" DESC);

CREATE INDEX "ProductFeedback_reviewStatus_createdAt_idx"
ON "ProductFeedback"("reviewStatus", "createdAt" DESC);
