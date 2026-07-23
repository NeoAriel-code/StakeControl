import assert from "node:assert/strict";
import test from "node:test";
import { assertProductionEmailConfiguration, getEmailConfiguration } from "../src/lib/email/email-config";

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
      securityFrom: "StakeControl <no-reply@notify.getstakecontrol.com>",
      alertsFrom: "StakeControl <no-reply@notify.getstakecontrol.com>",
      reportsFrom: "StakeControl <no-reply@notify.getstakecontrol.com>",
    }
  );
});

test("canonical sender variables configure each transactional sender while retaining legacy EMAIL_FROM compatibility", () => {
  assert.deepEqual(
    getEmailConfiguration({
      RESEND_API_KEY: "re_test",
      EMAIL_DEFAULT_FROM: "StakeControl <no-reply@notify.getstakecontrol.com>",
      EMAIL_SECURITY_FROM: "StakeControl Seguridad <no-reply@notify.getstakecontrol.com>",
      EMAIL_ALERTS_FROM: "StakeControl Alertas <no-reply@notify.getstakecontrol.com>",
      EMAIL_REPORTS_FROM: "StakeControl Reportes <no-reply@notify.getstakecontrol.com>",
      EMAIL_REPLY_TO: "support@getstakecontrol.com",
    }),
    {
      provider: "resend",
      apiKey: "re_test",
      from: "StakeControl <no-reply@notify.getstakecontrol.com>",
      securityFrom: "StakeControl Seguridad <no-reply@notify.getstakecontrol.com>",
      alertsFrom: "StakeControl Alertas <no-reply@notify.getstakecontrol.com>",
      reportsFrom: "StakeControl Reportes <no-reply@notify.getstakecontrol.com>",
      replyTo: "support@getstakecontrol.com",
    },
  );
});

test("production configuration fails closed when a required canonical variable is missing or points to Vercel", () => {
  assert.throws(
    () => assertProductionEmailConfiguration({ NODE_ENV: "production", APP_URL: "https://app.getstakecontrol.com", NEXT_PUBLIC_APP_URL: "https://app.getstakecontrol.com", RESEND_API_KEY: "re_test", EMAIL_DEFAULT_FROM: "StakeControl <no-reply@notify.getstakecontrol.com>", EMAIL_SECURITY_FROM: "StakeControl Seguridad <no-reply@notify.getstakecontrol.com>", EMAIL_ALERTS_FROM: "StakeControl Alertas <no-reply@notify.getstakecontrol.com>", EMAIL_REPLY_TO: "support@getstakecontrol.com", RESEND_WEBHOOK_SECRET: "whsec_test" }),
    /EMAIL_REPORTS_FROM/,
  );
  assert.throws(
    () => assertProductionEmailConfiguration({ NODE_ENV: "production", APP_URL: "https://stakecontrol.vercel.app", NEXT_PUBLIC_APP_URL: "https://app.getstakecontrol.com", RESEND_API_KEY: "re_test", EMAIL_DEFAULT_FROM: "StakeControl <no-reply@notify.getstakecontrol.com>", EMAIL_SECURITY_FROM: "StakeControl Seguridad <no-reply@notify.getstakecontrol.com>", EMAIL_ALERTS_FROM: "StakeControl Alertas <no-reply@notify.getstakecontrol.com>", EMAIL_REPORTS_FROM: "StakeControl Reportes <no-reply@notify.getstakecontrol.com>", EMAIL_REPLY_TO: "support@getstakecontrol.com", RESEND_WEBHOOK_SECRET: "whsec_test" }),
    /vercel\.app/,
  );
});

test("email config includes a nonblank Reply-To without making it required", () => {
  assert.deepEqual(
    getEmailConfiguration({
      EMAIL_PROVIDER: "resend",
      RESEND_API_KEY: "re_test",
      EMAIL_FROM: "StakeControl <no-reply@notify.getstakecontrol.com>",
      EMAIL_REPLY_TO: " support@getstakecontrol.com ",
    }),
    {
      provider: "resend",
      apiKey: "re_test",
      from: "StakeControl <no-reply@notify.getstakecontrol.com>",
      securityFrom: "StakeControl <no-reply@notify.getstakecontrol.com>",
      alertsFrom: "StakeControl <no-reply@notify.getstakecontrol.com>",
      reportsFrom: "StakeControl <no-reply@notify.getstakecontrol.com>",
      replyTo: "support@getstakecontrol.com",
    },
  );
});
