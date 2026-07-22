import assert from "node:assert/strict";
import test from "node:test";
import { getEmailConfiguration } from "../src/lib/email/email-config";

test("email config requires resend, an API key and sender", () => {
  assert.equal(
    getEmailConfiguration({
      EMAIL_PROVIDER: "resend",
      RESEND_API_KEY: "",
      EMAIL_FROM: "StakeControl <no-reply@notify.getstakecontrol.com>",
    }),
    null
  );
  assert.deepEqual(
    getEmailConfiguration({
      EMAIL_PROVIDER: "resend",
      RESEND_API_KEY: "re_test",
      EMAIL_FROM: "StakeControl <no-reply@notify.getstakecontrol.com>",
    }),
    {
      provider: "resend",
      apiKey: "re_test",
      from: "StakeControl <no-reply@notify.getstakecontrol.com>",
    }
  );
});
