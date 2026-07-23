import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ticketsPagePath = new URL("../src/app/tickets/page.tsx", import.meta.url);

test("recent tickets header stacks its copy on small screens", async () => {
  const source = await readFile(ticketsPagePath, "utf8");

  assert.match(
    source,
    /className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"/,
  );
});
