import { parseIsoDate, toIsoDate } from "@/lib/bookingDates";
import type { Booking } from "@/types/booking";
import type { Position } from "@/types/catalog";

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

export function summarizeYear(bookings: Booking[], year: number): {
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

export function yoyDeltaPct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export type DayTraffic = "free" | "limited" | "full";

export function dayTrafficLight(
  bookings: Booking[],
  pierPositionCount: number,
): DayTraffic {
  if (pierPositionCount <= 0) return "free";
  const active = bookings.filter((b) => b.status !== "c");
  const occupiedIds = new Set(
    active.map((b) => b.position).filter((id): id is number => id != null),
  );
  const occupied = occupiedIds.size;
  if (occupied <= 0) return "free";
  if (occupied >= pierPositionCount) return "full";
  if (occupied / pierPositionCount >= 0.5) return "limited";
  return "free";
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

export function formatTimeShort(value: string | null | undefined): string {
  if (!value) return "—";
  return value.slice(0, 5);
}

export function formatLoa(value: string | null | undefined): string {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `${Math.round(n)} m`;
}

export function activePierPositions(positions: Position[]): Position[] {
  return positions
    .filter((p) => p.is_active && p.position_type === "pier")
    .sort((a, b) => a.sort_order - b.sort_order || a.code.localeCompare(b.code));
}
