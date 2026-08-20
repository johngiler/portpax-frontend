import { parseIsoDate, toIsoDate } from "@/lib/bookingDates";
import type { BookingListItem } from "@/types/booking";
import type { Position } from "@/types/catalog";

export { bookingMatchesCatalogFocus } from "@/lib/bookingCatalogFocus";

/** Monday-based week start for the given ISO date. */
export function startOfWeekMonday(iso: string): string {
  const { year, monthIndex, day } = parseIsoDate(iso);
  const date = new Date(year, monthIndex, day);
  const weekday = date.getDay(); // 0 Sun … 6 Sat
  const offset = weekday === 0 ? -6 : 1 - weekday;
  date.setDate(date.getDate() + offset);
  return toIsoDate(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDaysIso(iso: string, days: number): string {
  const { year, monthIndex, day } = parseIsoDate(iso);
  const date = new Date(year, monthIndex, day);
  date.setDate(date.getDate() + days);
  return toIsoDate(date.getFullYear(), date.getMonth(), date.getDate());
}

export function weekDatesFrom(isoInWeek: string): string[] {
  const start = startOfWeekMonday(isoInWeek);
  return Array.from({ length: 7 }, (_, i) => addDaysIso(start, i));
}

export function monthBounds(year: number, monthIndex: number): { from: string; to: string } {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return {
    from: toIsoDate(year, monthIndex, 1),
    to: toIsoDate(year, monthIndex, lastDay),
  };
}

/** Inclusive calendar year (Jan 1 – Dec 31). */
export function yearBounds(year: number): { from: string; to: string } {
  return {
    from: toIsoDate(year, 0, 1),
    to: toIsoDate(year, 11, 31),
  };
}

/** Calendar season for annual view (Fernanda / Excel ops). */
export type CalendarSeason = "natural" | "summer" | "winter";

/**
 * Summer: 1 May – 31 Oct of `year`.
 * Winter: 1 Nov `year` – 30 Apr `year+1`.
 * Natural: full calendar year.
 */
export function seasonBounds(
  year: number,
  season: CalendarSeason,
): { from: string; to: string } {
  if (season === "summer") {
    return {
      from: toIsoDate(year, 4, 1),
      to: toIsoDate(year, 9, 31),
    };
  }
  if (season === "winter") {
    return {
      from: toIsoDate(year, 10, 1),
      to: toIsoDate(year + 1, 3, 30),
    };
  }
  return yearBounds(year);
}

export function seasonLabel(season: CalendarSeason): string {
  if (season === "summer") return "Summer";
  if (season === "winter") return "Winter";
  return "Año natural";
}

/** Month indices (year, monthIndex 0–11) covered by a season range, inclusive. */
export function monthsInSeason(
  year: number,
  season: CalendarSeason,
): { year: number; monthIndex: number }[] {
  const { from, to } = seasonBounds(year, season);
  const start = parseIsoDate(from);
  const end = parseIsoDate(to);
  const out: { year: number; monthIndex: number }[] = [];
  let y = start.year;
  let m = start.monthIndex;
  while (y < end.year || (y === end.year && m <= end.monthIndex)) {
    out.push({ year: y, monthIndex: m });
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  return out;
}

export function summarizeMonth(
  bookings: BookingListItem[],
  year: number,
  monthIndex: number,
): { ships: number; plannedPax: number } {
  let ships = 0;
  let plannedPax = 0;
  for (const b of bookings) {
    if (b.status === "c") continue;
    const [y, m] = b.call_date.split("-").map(Number);
    if (y === year && m === monthIndex + 1) {
      ships += 1;
      plannedPax += b.planned_pax ?? 0;
    }
  }
  return { ships, plannedPax };
}

export function summarizeYear(bookings: BookingListItem[], year: number): {
  calls: number;
  plannedPax: number;
} {
  let calls = 0;
  let plannedPax = 0;
  for (const b of bookings) {
    if (b.status === "c") continue;
    if (!b.call_date.startsWith(String(year))) continue;
    calls += 1;
    plannedPax += b.planned_pax ?? 0;
  }
  return { calls, plannedPax };
}

/** Aggregate ships + PAX for an arbitrary inclusive ISO range. */
export function summarizeRange(
  bookings: BookingListItem[],
  from: string,
  to: string,
): { ships: number; plannedPax: number } {
  let ships = 0;
  let plannedPax = 0;
  for (const b of bookings) {
    if (b.status === "c") continue;
    if (b.call_date < from || b.call_date > to) continue;
    ships += 1;
    plannedPax += b.planned_pax ?? 0;
  }
  return { ships, plannedPax };
}

export function yoyDeltaPct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export type DayTraffic = "free" | "limited" | "full";

export function dayTrafficLight(
  bookings: BookingListItem[],
  pierPositionCount: number,
): DayTraffic {
  const active = bookings.filter((b) => b.status !== "c");
  if (active.length === 0) return "free";

  if (pierPositionCount <= 0) {
    if (active.length >= 3) return "full";
    return "limited";
  }

  const occupiedIds = new Set(
    active.map((b) => b.position).filter((id): id is number => id != null),
  );
  // Unassigned calls still consume capacity for occupancy display.
  const unassigned = active.filter((b) => b.position == null).length;
  const occupied = Math.min(
    pierPositionCount,
    occupiedIds.size + unassigned,
  );
  if (occupied <= 0) return "free";
  if (occupied >= pierPositionCount) return "full";
  if (occupied / pierPositionCount >= 0.5) return "limited";
  return "free";
}

/** Annual mini-calendar heat: vacant days = free (green); busy = limited/full. */
export function dayAnnualHeat(
  bookings: BookingListItem[],
  pierPositionCount: number,
  multiPort: boolean,
): DayTraffic {
  const active = bookings.filter((b) => b.status !== "c");
  if (active.length === 0) return "free";
  if (multiPort) {
    return active.length <= 2 ? "limited" : "full";
  }
  const light = dayTrafficLight(active, pierPositionCount);
  // Keep days-with-calls visually distinct from vacant (available) days.
  return light === "free" ? "limited" : light;
}

export const TRAFFIC_DOT: Record<DayTraffic, string> = {
  free: "bg-emerald-500",
  limited: "bg-amber-400",
  full: "bg-red-500",
};

export const TRAFFIC_LABEL: Record<DayTraffic, string> = {
  free: "Disponible",
  limited: "Pocas opciones",
  full: "Sin disponibilidad",
};

export { formatLoa, formatTimeShort } from "@/lib/bookingDisplay";

/** Active pier + anchorage rows for week/annual calendars (excludes inactive). */
export function activePierPositions(positions: Position[]): Position[] {
  return positions
    .filter((p) => p.is_active)
    .sort((a, b) => a.sort_order - b.sort_order || a.code.localeCompare(b.code));
}

/** Statuses that count toward occupancy (aligned with dashboard OCCUPANCY_STATUSES). */
const OCCUPANCY_STATUSES = new Set(["co", "cl", "lta", "ltd", "r"]);

/**
 * Occupancy % for a calendar month: occupied slot-days / (pier positions × days).
 * Same formula as dashboard KPIs.
 */
export function monthOccupancy(
  bookings: BookingListItem[],
  pierCount: number,
  year: number,
  monthIndex: number,
): { pct: number; occupied: number; capacity: number } {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const capacity = pierCount * daysInMonth;
  let occupied = 0;
  for (const b of bookings) {
    if (!OCCUPANCY_STATUSES.has(b.status)) continue;
    const [y, m] = b.call_date.split("-").map(Number);
    if (y === year && m === monthIndex + 1) occupied += 1;
  }
  const pct =
    capacity > 0 ? Math.round((occupied / capacity) * 1000) / 10 : 0;
  return { pct, occupied, capacity };
}
