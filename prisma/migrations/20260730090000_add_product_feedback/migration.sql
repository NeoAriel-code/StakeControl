CREATE TABLE "ProductFeedback" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "currentPath" TEXT NOT NULL,
  "technicalData" JSONB,
  "contactUserId" TEXT,
  "reviewStatus" TEXT NOT NULL DEFAULT 'NEW',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ProductFeedback_contactUserId_fkey" FOREIGN KEY ("contactUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ProductFeedback_category_reviewStatus_createdAt_idx" ON "ProductFeedback"("category", "reviewStatus", "createdAt");
CREATE INDEX "ProductFeedback_contactUserId_idx" ON "ProductFeedback"("contactUserId");

CREATE TABLE "OcrExtractionFeedback" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "aiExtractionId" TEXT NOT NULL,
  "rating" TEXT NOT NULL,
  "comment" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OcrExtractionFeedback_aiExtractionId_fkey" FOREIGN KEY ("aiExtractionId") REFERENCES "AIExtraction" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "OcrExtractionFeedback_aiExtractionId_key" ON "OcrExtractionFeedback"("aiExtractionId");
CREATE INDEX "OcrExtractionFeedback_rating_createdAt_idx" ON "OcrExtractionFeedback"("rating", "createdAt");
