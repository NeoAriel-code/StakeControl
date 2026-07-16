import test from "node:test";
import assert from "node:assert/strict";
import { buildBetsCsv, escapeCsvValue } from "../src/lib/bet-csv-export";

const baseBet = {
  placedAt: new Date("2026-07-13T12:00:00.000Z"),
  sportsbook: "DemoBook",
  sport: "Fútbol",
  league: "Chile",
  market: "Ganador",
  selection: "Local",
  betType: "SINGLE",
  stake: "10000",
  odds: "1.85",
  result: "WON",
  profitLoss: "8500",
  currency: "CLP",
  ticketCode: "ABC-123",
  notes: "Nota con \"comillas\"",
  ticketImages: [
    {
      aiExtraction: {
        confidence: "0.92",
      },
    },
  ],
};

test("buildBetsCsv exports basic columns for free users", () => {
  const csv = buildBetsCsv([baseBet], "FREE");

  assert.equal(csv.split("\n")[0], '"fecha","sportsbook","deporte","liga","mercado","seleccion","tipo","stake","cuota","resultado","netProfit","moneda"');
  assert.match(csv, /"2026-07-13T12:00:00.000Z","DemoBook","Fútbol","Chile","Ganador","Local","SINGLE","10000","1.85","WON","8500","CLP"/);
  assert.doesNotMatch(csv, /ticketCode/);
  assert.doesNotMatch(csv, /ABC-123/);
});

test("buildBetsCsv exports premium columns for premium users", () => {
  const csv = buildBetsCsv([baseBet], "PREMIUM");

  assert.match(csv.split("\n")[0], /"ticketCode","notas","categoria","origen","confidenceScore"$/);
  assert.match(csv, /"ABC-123","Nota con ""comillas""","Fútbol \/ Ganador","OCR","0.92"/);
});

test("CSV exports an empty date for a bet without placedAt", () => {
  const csv = buildBetsCsv([{ ...baseBet, placedAt: null }], "FREE");

  assert.match(csv.split("\n")[1]!, /^""/);
});

test("CSV neutralizes spreadsheet formulas in every dangerous prefix", () => {
  for (const value of ["=SUM(A1:A2)", "+1+1", "-1+1", "@SUM(A1:A2)"]) {
    assert.equal(escapeCsvValue(value), `"'${value}"`);
  }
});
