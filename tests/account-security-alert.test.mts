import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("dashboard layout renders account security email alerts", async () => {
  const layout = await readFile(new URL("../src/app/dashboard/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /EmailSecurityAlert/);
});
