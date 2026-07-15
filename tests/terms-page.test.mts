import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const termsPagePath = new URL("../src/app/terms/page.tsx", import.meta.url);

test("terms page states the MVP scope, global use rules and contact channels", async () => {
  const source = await readFile(termsPagePath, "utf8");
  const renderedText = source.replace(/\s+/g, " ");

  for (const expectedCopy of [
    "contact@getstakecontrol.com",
    "privacy@getstakecontrol.com",
    "no acepta, ejecuta, procesa, transmite, liquida ni intermedia apuestas",
    "Tampoco ofrece afiliados, enlaces a operadores, bonos, promociones",
    "normativa aplicable en tu ubicación",
    "herramientas de apoyo",
    "no hay pasarela de pago, cargos, renovaciones automáticas ni reembolsos activos",
    "leyes de Chile",
    "mayores de edad",
  ]) {
    assert.ok(renderedText.includes(expectedCopy), `Expected terms to include: ${expectedCopy}`);
  }
});
