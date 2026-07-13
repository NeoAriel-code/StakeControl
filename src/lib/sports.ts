export const SPORT_OPTIONS = [
  "Fútbol",
  "Tenis",
  "Basket",
  "MMA",
  "Baseball",
  "Fútbol americano",
  "Hockey",
  "eSports",
] as const;

export type SportOption = (typeof SPORT_OPTIONS)[number];

export function parsePreferredSports(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((sport) => sport.trim())
    .filter(Boolean);
}
