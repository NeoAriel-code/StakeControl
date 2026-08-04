import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("application routes send the required security headers", async () => {
  const config = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");

  assert.match(config, /X-Content-Type-Options.*nosniff/);
  assert.match(config, /X-Frame-Options.*DENY/);
  assert.match(config, /frame-ancestors 'none'/);
  assert.match(config, /object-src 'none'/);
  assert.match(config, /script-src[^;]*https:\/\/us\.i\.posthog\.com/);
  assert.match(config, /script-src[^;]*https:\/\/us-assets\.i\.posthog\.com/);
  assert.match(config, /connect-src[^;]*https:\/\/us\.i\.posthog\.com/);
  assert.match(config, /connect-src[^;]*https:\/\/us-assets\.i\.posthog\.com/);
  assert.match(config, /connect-src[^;]*https:\/\/\*\.ingest\.sentry\.io/);
  assert.match(config, /connect-src[^;]*https:\/\/\*\.ingest\.us\.sentry\.io/);
});
