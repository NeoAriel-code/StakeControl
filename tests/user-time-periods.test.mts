import test from "node:test";
import assert from "node:assert/strict";
import {
  formatDateTimeLocalForUserTimezone,
  parseDateTimeInUserTimezone,
  getLocalDateKey,
  getMonthBoundsForUserTimezone,
  getPeriodStartsForUserTimezone,
  getYearMonthForUserTimezone,
} from "../src/lib/user-time-periods";

test("user period boundaries use the user's local calendar month", () => {
  const referenceDate = new Date("2026-07-01T02:30:00.000Z");
  const bounds = getMonthBoundsForUserTimezone(referenceDate, "America/Santiago");

  assert.equal(bounds.start.toISOString(), "2026-06-01T04:00:00.000Z");
  assert.equal(bounds.end.toISOString(), "2026-07-01T04:00:00.000Z");
  assert.deepEqual(getYearMonthForUserTimezone(referenceDate, "America/Santiago"), { year: 2026, month: 6 });
  assert.equal(getLocalDateKey(referenceDate, "America/Santiago"), "2026-06-30");
});

test("daily and weekly periods begin in the user's timezone", () => {
  const periods = getPeriodStartsForUserTimezone(
    new Date("2026-07-01T02:30:00.000Z"),
    "America/Santiago"
  );

  assert.equal(periods.dailyStart.toISOString(), "2026-06-30T04:00:00.000Z");
  assert.equal(periods.weeklyStart.toISOString(), "2026-06-29T04:00:00.000Z");
});

test("datetime-local values are persisted as the user's wall-clock time", () => {
  const instant = parseDateTimeInUserTimezone(
    "2026-07-21T21:30",
    "America/Santiago"
  );

  assert.equal(instant?.toISOString(), "2026-07-22T01:30:00.000Z");
  assert.equal(
    formatDateTimeLocalForUserTimezone(instant!, "America/Santiago"),
    "2026-07-21T21:30"
  );
});
