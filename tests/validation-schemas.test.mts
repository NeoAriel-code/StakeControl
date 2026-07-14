import test from "node:test";
import assert from "node:assert/strict";
import { BetResult, BetType } from "@prisma/client";
import { betFormSchema } from "../src/lib/bet-schemas";
import { reviewedTicketBetSchema, ticketLegSchema } from "../src/lib/ticket-extraction";

test("betFormSchema accepts valid manual bet input", () => {
  const parsed = betFormSchema.parse({
    sportsbook: "DemoBook",
    placedAt: "2026-07-13T10:00",
    event: "Equipo A vs Equipo B",
    sport: "Fútbol",
    league: "Chile",
    market: "Ganador",
    selection: "Equipo A",
    betType: BetType.SINGLE,
    stake: "10000",
    odds: "1.85",
    currency: "CLP",
    potentialPayout: "",
    result: BetResult.PENDING,
    netProfit: "0",
    ticketCode: "",
    notes: "  nota  ",
  });

  assert.equal(parsed.stake, 10000);
  assert.equal(parsed.notes, "nota");
  assert.equal(parsed.ticketCode, undefined);
});

test("betFormSchema rejects invalid odds and negative stake", () => {
  const parsed = betFormSchema.safeParse({
    placedAt: "2026-07-13T10:00",
    event: "Evento",
    betType: BetType.SINGLE,
    stake: "-1",
    odds: "1",
    currency: "CLP",
    result: BetResult.PENDING,
    netProfit: "0",
  });

  assert.equal(parsed.success, false);
});

test("betFormSchema only accepts meaningful ticket types and results", () => {
  const baseBet = {
    placedAt: "2026-07-13T10:00",
    event: "Evento",
    stake: "1000",
    odds: "1.8",
    currency: "CLP",
    result: BetResult.PENDING,
    netProfit: "0",
  };

  assert.equal(betFormSchema.safeParse({ ...baseBet, betType: BetType.COMBO }).success, true);
  assert.equal(betFormSchema.safeParse({ ...baseBet, betType: BetType.LIVE }).success, false);
  assert.equal(betFormSchema.safeParse({ ...baseBet, betType: BetType.UNKNOWN }).success, false);
  assert.equal(
    betFormSchema.safeParse({ ...baseBet, betType: BetType.SINGLE, result: BetResult.UNKNOWN }).success,
    false
  );
});

test("betFormSchema accepts supported crypto currencies and rejects unknown currencies", () => {
  const validCryptoBet = {
    placedAt: "2026-07-13T10:00",
    event: "Evento",
    betType: BetType.SINGLE,
    stake: "0.05",
    odds: "2.25",
    currency: "BTC",
    result: BetResult.PENDING,
    netProfit: "0",
  };

  assert.equal(betFormSchema.safeParse(validCryptoBet).success, true);
  assert.equal(
    betFormSchema.safeParse({
      ...validCryptoBet,
      currency: "MAGIC",
    }).success,
    false
  );
});

test("reviewedTicketBetSchema validates confidence score bounds", () => {
  const parsed = reviewedTicketBetSchema.safeParse({
    event: "Evento OCR",
    placedAt: "2026-07-13T10:00",
    betType: BetType.SINGLE,
    stake: "5000",
    odds: "2.10",
    currency: "CLP",
    result: BetResult.PENDING,
    netProfit: "0",
    confidenceScore: "1.5",
    doubtfulFields: [],
  });

  assert.equal(parsed.success, false);
});

test("ticket review accepts multiple legs and preserves a Bet Builder type", () => {
  const parsed = reviewedTicketBetSchema.parse({
    event: "Noruega vs Inglaterra",
    placedAt: "2026-07-13T10:00",
    betType: BetType.BET_BUILDER,
    stake: "5000",
    odds: "2.10",
    currency: "CLP",
    result: BetResult.PENDING,
    netProfit: "0",
    confidenceScore: "0.72",
    doubtfulFields: ["legs"],
    legs: [
      { event: "Noruega vs Inglaterra", market: "Más de 1.5", selection: "Sí", odds: "1.40" },
      { event: "Noruega vs Inglaterra", market: "Corners", selection: "Más de 8.5", odds: "1.50" },
    ],
  });

  assert.equal(parsed.betType, BetType.BET_BUILDER);
  assert.equal(parsed.legs.length, 2);
  assert.equal(parsed.legs[1]?.odds, 1.5);
});

test("ticket legs require an event and reject invalid individual odds", () => {
  assert.equal(ticketLegSchema.safeParse({ event: "" }).success, false);
  assert.equal(ticketLegSchema.safeParse({ event: "Evento", odds: "1" }).success, false);
});
