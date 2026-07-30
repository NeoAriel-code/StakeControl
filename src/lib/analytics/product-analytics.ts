"use client";

import posthog from "posthog-js";
import { getAnalyticsConsent } from "@/lib/analytics/analytics-consent";

export const ANALYTICS_EVENT_NAMES = [
  "account_created", "email_verified", "onboarding_completed", "first_manual_bet_created",
  "ticket_upload_started", "ticket_completed", "ticket_ocr_failed", "ticket_review_completed",
  "ticket_saved", "limit_configured", "pause_activated", "alert_viewed", "csv_exported",
  "feedback_submitted", "account_deleted",
] as const;

export type ProductAnalyticsEvent = (typeof ANALYTICS_EVENT_NAMES)[number];
export type ProductAnalyticsProperties = Partial<{
  ocr_provider: "google_vision" | "mock" | "aws_textract" | "azure_vision" | "tesseract";
  ai_model: string;
  processing_duration_ms: number;
  manual_corrections_count: number;
  confidence_band: "low" | "medium" | "high";
  file_type: "png" | "jpg" | "webp";
  feedback_category: "error" | "confusing_feature" | "suggestion";
  technical_data_authorized: boolean;
  contact_authorized: boolean;
}>;

let initialized = false;

function getKey() {
  return process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
}

function validProperties(properties: ProductAnalyticsProperties) {
  return Object.values(properties).every((value) =>
    typeof value !== "number" || (Number.isFinite(value) && value >= 0),
  );
}

export function enableProductAnalytics() {
  if (typeof window === "undefined" || initialized || !getKey() || getAnalyticsConsent() !== "granted") return;

  try {
    posthog.init(getKey()!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com",
      autocapture: false,
      capture_pageview: false,
      disable_session_recording: true,
      person_profiles: "never",
    });
    initialized = true;
  } catch {
    initialized = false;
  }
}

export function disableProductAnalytics() {
  try {
    posthog.reset();
    posthog.opt_out_capturing();
  } catch {
    // Analytics must never affect product use.
  } finally {
    initialized = false;
  }
}

export function captureProductEvent(event: ProductAnalyticsEvent, properties: ProductAnalyticsProperties = {}) {
  if (!initialized || !validProperties(properties)) return;

  try {
    posthog.capture(event, properties);
  } catch {
    // Analytics must never affect product use.
  }
}
