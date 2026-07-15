import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const quickResultPath = new URL("../src/components/bets/QuickBetResultSelect.tsx", import.meta.url);
const navbarPath = new URL("../src/components/layout/Navbar.tsx", import.meta.url);

test("quick result uses the server result as an optimistic base without an effect sync", async () => {
  const source = await readFile(quickResultPath, "utf8");

  assert.match(source, /useOptimistic\(result\)/);
  assert.doesNotMatch(source, /useEffect\(\(\) => \{\s*setSelectedResult\(result\)/);
});

test("opening alerts loads unread alerts from the click handler, not an effect", async () => {
  const source = await readFile(navbarPath, "utf8");

  assert.match(source, /function handleAlertsToggle\(\)/);
  assert.match(source, /onClick=\{handleAlertsToggle\}/);
  assert.doesNotMatch(source, /useEffect\(\(\) => \{\s*if \(!alertsOpen\)/);
});
