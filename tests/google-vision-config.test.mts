import test from "node:test";
import assert from "node:assert/strict";
import { parseGoogleVisionCredentials } from "../src/lib/google-vision-config";

test("Google Vision credentials require a valid service account shape", () => {
  assert.throws(() => parseGoogleVisionCredentials(undefined), /no está configurada/);
  assert.throws(() => parseGoogleVisionCredentials("not-json"), /JSON válido/);
  assert.throws(() => parseGoogleVisionCredentials(JSON.stringify({ client_email: "service@example.com" })), /private_key/);
  assert.deepEqual(
    parseGoogleVisionCredentials(JSON.stringify({ client_email: "service@example.com", private_key: "private-key", project_id: "stakecontrol" })),
    { client_email: "service@example.com", private_key: "private-key", project_id: "stakecontrol" }
  );
});
