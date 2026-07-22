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

function isValidCalendarDateTime(parts: ZonedParts) {
  const candidate = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  );

  return (
    candidate.getUTCFullYear() === parts.year &&
    candidate.getUTCMonth() + 1 === parts.month &&
    candidate.getUTCDate() === parts.day &&
    candidate.getUTCHours() === parts.hour &&
    candidate.getUTCMinutes() === parts.minute &&
    candidate.getUTCSeconds() === parts.second
  );
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function parseDateTimeInUserTimezone(value: string, timezone = "UTC") {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);

  if (!match) return null;

  const requested: ZonedParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? 0),
  };

  if (!isValidCalendarDateTime(requested)) return null;

  const wallClock = Date.UTC(
    requested.year,
    requested.month - 1,
    requested.day,
    requested.hour,
    requested.minute,
    requested.second
  );
  let candidate = new Date(wallClock);

  try {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const represented = zonedParts(candidate, timezone);
      const representedWallClock = Date.UTC(
        represented.year,
        represented.month - 1,
        represented.day,
        represented.hour,
        represented.minute,
        represented.second
      );
      const correction = wallClock - representedWallClock;
      if (correction === 0) break;
      candidate = new Date(candidate.getTime() + correction);
    }

    const resolved = zonedParts(candidate, timezone);
    return Object.entries(requested).every(
      ([key, part]) => resolved[key as keyof ZonedParts] === part
    )
      ? candidate
      : null;
  } catch {
    return null;
  }
}

export function formatDateTimeLocalForUserTimezone(date: Date, timezone = "UTC") {
  const local = zonedParts(date, timezone);
  return `${local.year}-${pad(local.month)}-${pad(local.day)}T${pad(local.hour)}:${pad(local.minute)}`;
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
