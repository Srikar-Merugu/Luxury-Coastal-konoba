import type { L, Season } from "./content";

export type Override = { active: boolean; note: L };

export type Status =
  | { kind: "open"; season: Season; closes: string }
  | { kind: "later"; season: Season; opens: string }
  | { kind: "closed-today"; season: Season }
  | { kind: "off-season"; reopens: string }
  | { kind: "override" };

/** Wall-clock parts in the venue's timezone, so the status is right for any visitor. */
export function zagrebNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Zagreb",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    year: Number(get("year")),
    mmdd: `${get("month")}-${get("day")}`,
    hhmm: `${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}`,
    weekday: weekdays.indexOf(get("weekday")),
  };
}

export function seasonFor(seasons: Season[], mmdd: string): Season | null {
  return seasons.find((s) => mmdd >= s.from && mmdd <= s.to) ?? null;
}

export function getStatus(seasons: Season[], override: Override, date = new Date()): Status {
  if (override.active) return { kind: "override" };
  const now = zagrebNow(date);
  const season = seasonFor(seasons, now.mmdd);
  if (!season) {
    const first = seasons[0].from;
    const year = now.mmdd > first ? now.year + 1 : now.year;
    return { kind: "off-season", reopens: `${year}-${first}` };
  }
  const today = season.hours[now.weekday];
  if (!today) return { kind: "closed-today", season };
  const [opens, closes] = today;
  if (now.hhmm < opens) return { kind: "later", season, opens };
  if (now.hhmm < closes) return { kind: "open", season, closes };
  return { kind: "closed-today", season };
}
