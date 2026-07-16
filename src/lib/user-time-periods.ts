type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function zonedParts(date: Date, timezone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

function zonedMidnight(year: number, month: number, day: number, timezone: string) {
  const guess = new Date(Date.UTC(year, month - 1, day));
  const local = zonedParts(guess, timezone);
  const offset = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second) - guess.getTime();
  return new Date(guess.getTime() - offset);
}

function calendarDate(year: number, month: number, day: number) {
  const value = new Date(Date.UTC(year, month - 1, day));
  return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate() };
}

export function getMonthBoundsForUserTimezone(referenceDate = new Date(), timezone = "UTC") {
  const local = zonedParts(referenceDate, timezone);
  const nextMonth = calendarDate(local.year, local.month + 1, 1);

  return {
    start: zonedMidnight(local.year, local.month, 1, timezone),
    end: zonedMidnight(nextMonth.year, nextMonth.month, 1, timezone),
  };
}

export function getYearMonthForUserTimezone(referenceDate = new Date(), timezone = "UTC") {
  const local = zonedParts(referenceDate, timezone);
  return { year: local.year, month: local.month };
}

export function getLocalDateKey(referenceDate: Date, timezone = "UTC") {
  const { year, month, day } = zonedParts(referenceDate, timezone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getPeriodStartsForUserTimezone(referenceDate = new Date(), timezone = "UTC") {
  const local = zonedParts(referenceDate, timezone);
  const weekday = new Date(Date.UTC(local.year, local.month - 1, local.day)).getUTCDay();
  const mondayOffset = weekday === 0 ? 6 : weekday - 1;
  const monday = calendarDate(local.year, local.month, local.day - mondayOffset);

  return {
    dailyStart: zonedMidnight(local.year, local.month, local.day, timezone),
    weeklyStart: zonedMidnight(monday.year, monday.month, monday.day, timezone),
    monthlyStart: zonedMidnight(local.year, local.month, 1, timezone),
  };
}
