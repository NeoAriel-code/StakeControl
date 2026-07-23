import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the public landing presents Premium as a no-charge selected beta instead of a purchasable plan", async () => {
  const landing = await readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8");
  const badge = await readFile(new URL("../src/components/layout/BetaBadge.tsx", import.meta.url), "utf8");

  assert.match(badge, /StakeControl Beta/);
  assert.match(landing, /Premium Beta/);
  assert.match(landing, /Disponible para participantes seleccionados/);
  assert.match(landing, /Sin cobro durante el período de prueba/);
  assert.doesNotMatch(landing, /\$4\.990|CLP \/ mes|Probar Premium/);
});
