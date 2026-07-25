import assert from "node:assert/strict";
import test from "node:test";

import {
  ANALYTICS_EVENT_NAMES,
  captureProductEvent,
  type ProductAnalyticsEvent,
} from "../src/lib/analytics/product-analytics";

test("product analytics exposes only the approved event catalog", () => {
  const expected: ProductAnalyticsEvent[] = [
    "account_created",
    "email_verified",
    "onboarding_completed",
    "first_manual_bet_created",
    "ticket_upload_started",
    "ticket_completed",
    "ticket_ocr_failed",
    "ticket_review_completed",
    "ticket_saved",
    "limit_configured",
    "pause_activated",
    "alert_viewed",
    "csv_exported",
    "feedback_submitted",
    "account_deleted",
  ];

  assert.deepEqual(ANALYTICS_EVENT_NAMES, expected);
});

test("product analytics is a no-op on the server", () => {
  assert.doesNotThrow(() => {
    captureProductEvent("ticket_completed", {
      ocr_provider: "google_vision",
      ai_model: "gpt-4.1-mini",
      processing_duration_ms: 920,
      confidence_band: "high",
      file_type: "jpg",
    });
  });
});
