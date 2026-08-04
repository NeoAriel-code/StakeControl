import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("ticket workflow uses three durable ID-only steps", async () => {
  const workflow = await readFile(new URL("../workflows/process-ticket-extraction.ts", import.meta.url), "utf8");
  const steps = await readFile(new URL("../workflows/steps/ticket-extraction-steps.ts", import.meta.url), "utf8");
  assert.match(workflow, /"use workflow"/);
  assert.match(steps, /processTicketOcrStep/);
  assert.match(steps, /processTicketAiStep/);
  assert.match(steps, /finalizeTicketExtractionStep/);
  assert.doesNotMatch(workflow, /rawText|prompt|extractedData/);
  assert.match(steps, /extractionVersion/);
  assert.match(steps, /updateMany/);
});

test("ticket extraction migration is additive and indexes queue status", async () => {
  const sql = await readFile(new URL("../prisma/migrations/20260803100000_extend_ai_extraction/migration.sql", import.meta.url), "utf8");
  const indexSql = await readFile(new URL("../prisma/migrations/20260803100500_index_ai_extraction_status/migration.sql", import.meta.url), "utf8");
  assert.doesNotMatch(sql, /DROP\s+(?:TABLE|COLUMN)/i);
  assert.match(sql, /workflowRunId/);
  assert.match(indexSql, /AIExtraction_status_createdAt_idx/);
});
