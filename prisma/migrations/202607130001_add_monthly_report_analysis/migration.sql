-- AlterTable
ALTER TABLE "MonthlyReport" ADD COLUMN "analysisData" JSONB;
ALTER TABLE "MonthlyReport" ADD COLUMN "safePromptVersion" TEXT;
ALTER TABLE "MonthlyReport" ADD COLUMN "analysisGeneratedAt" DATETIME;
