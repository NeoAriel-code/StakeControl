import test from "node:test";
import assert from "node:assert/strict";
import { BetResult, BetType } from "@prisma/client";
import type { AiProvider } from "../src/lib/ai/ai-provider";
import { parseTicketWithRouting } from "../src/lib/ai/ticket-parser";

function extraction(confidenceScore: number) {
  return {
    sportsbook: "StakeControl Test", event: "Equipo A vs Equipo B", placedAt: "2026-07-13T10:00", sport: "Fútbol", league: null, market: "Ganador", selection: "Equipo A", betType: BetType.SINGLE, stake: 5000, odds: 2.1, currency: "CLP", potentialPayout: 10500, result: BetResult.PENDING, netProfit: 0, ticketCode: null, notes: null, confidenceScore, doubtfulFields: confidenceScore < 0.85 ? ["league"] : [], legs: [{ event: "Equipo A vs Equipo B", sport: "Fútbol", league: null, market: "Ganador", selection: "Equipo A", odds: 2.1, result: BetResult.PENDING }],
  };
}

test("ticket routing retries with fallback below confidence threshold", async () => {
  const calls: string[] = [];
  const provider: AiProvider = {
    async generateStructured<T>(input: Parameters<AiProvider["generateStructured"]>[0]) {
      calls.push(input.model);
      return { data: extraction(calls.length === 1 ? 0.6 : 0.9) as T, model: input.model, estimatedTokens: 12 };
    },
  };
  const result = await parseTicketWithRouting("Ticket OCR", provider);
  assert.equal(result.fallbackUsed, true);
  assert.equal(result.ticket.confidenceScore, 0.9);
  assert.equal(calls.length, 2);
});

test("ticket routing preserves primary output with sufficient confidence", async () => {
  const provider: AiProvider = {
    async generateStructured<T>(input: Parameters<AiProvider["generateStructured"]>[0]) {
      return { data: extraction(0.9) as T, model: input.model, estimatedTokens: 9 };
    },
  };
  const result = await parseTicketWithRouting("Ticket OCR", provider);
  assert.equal(result.fallbackUsed, false);
  assert.equal(result.estimatedTokens, 9);
});

test("mock AI does not invent ticket fields from real OCR text", async () => {
  const result = await parseTicketWithRouting("Betano\nSimple $50.000,00\nNoruega\nInglaterra");

  assert.equal(result.ticket.event, "Evento por confirmar");
  assert.equal(result.ticket.stake, 0);
  assert.equal(result.ticket.confidenceScore, 0);
  assert.match(result.ticket.notes ?? "", /Texto OCR disponible/);
});

test("ticket routing keeps OCR available for manual review when AI is unavailable", async () => {
  const unavailableProvider: AiProvider = {
    async generateStructured() {
      throw new Error("Provider unavailable");
    },
  };

  const result = await parseTicketWithRouting("Texto OCR real", unavailableProvider);

  assert.equal(result.model, "manual-review");
  assert.equal(result.ticket.confidenceScore, 0);
  assert.equal(result.ticket.legs.length, 1);
  assert.match(result.ticket.notes ?? "", /no pudo completarse/);
});
