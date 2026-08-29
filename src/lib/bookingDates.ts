/** ISO date string YYYY-MM-DD from local calendar parts (no UTC drift). */
export function toIsoDate(year: number, monthIndex: number, day: number): string {
  const y = String(year);
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Today's date in local timezone as ISO YYYY-MM-DD. */
export function localTodayIso(): string {
  const d = new Date();
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

export function parseIsoDate(value: string): { year: number; monthIndex: number; day: number } {
  const [y, m, d] = value.split("-").map(Number);
  return { year: y, monthIndex: m - 1, day: d };
}

/** Add calendar years to an ISO date (same month/day; clamps invalid leap days). */
export function addYearsToIsoDate(iso: string, years: number): string {
  const { year, monthIndex, day } = parseIsoDate(iso);
  const targetYear = year + years;
  const lastDay = new Date(targetYear, monthIndex + 1, 0).getDate();
  return toIsoDate(targetYear, monthIndex, Math.min(day, lastDay));
}

/** Display ISO YYYY-MM-DD as dd/mm/aaaa. */
export function formatIsoAsDmy(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const { year, monthIndex, day } = parseIsoDate(iso);
  return `${String(day).padStart(2, "0")}/${String(monthIndex + 1).padStart(2, "0")}/${year}`;
}

/** Parse dd/mm/aaaa (also -, .) into ISO YYYY-MM-DD, or null if invalid. */
export function parseDmyToIso(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(year, month - 1, day);
  if (
    dt.getFullYear() !== year ||
    dt.getMonth() !== month - 1 ||
    dt.getDate() !== day
  ) {
    return null;
  }
  return toIsoDate(year, month - 1, day);
}

/** Short weekday for calendar headers and date labels (e.g. Lun, Mar, Mié). */
export function formatIsoWeekdayShort(value: string): string {
  const { year, monthIndex, day } = parseIsoDate(value);
  const date = new Date(year, monthIndex, day);
  const raw = date.toLocaleDateString("es-MX", { weekday: "short" });
  const cleaned = raw.replace(/\.$/, "").trim();
  if (!cleaned) return "";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/** Visible calendar dates always include weekday: "Lun 10 ago 2026" / "Lun 10 de agosto de 2026". */
export function formatIsoDateLabel(value: string, style: "short" | "long" = "long"): string {
  const { year, monthIndex, day } = parseIsoDate(value);
  const date = new Date(year, monthIndex, day);
  const rest = date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
  });
  const weekday = formatIsoWeekdayShort(value);
  return weekday ? `${weekday} ${rest}` : rest;
}

export function getMonthMatrix(year: number, monthIndex: number): (number | null)[][] {
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export type CalendarCell = {
  day: number;
  year: number;
  monthIndex: number;
  iso: string;
  isCurrentMonth: boolean;
};

/** Full month grid including trailing/leading days from adjacent months. */
export function getCalendarGrid(year: number, monthIndex: number): CalendarCell[][] {
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, monthIndex, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let index = firstWeekday - 1; index >= 0; index -= 1) {
    const day = daysInPrevMonth - index;
    const prevMonthIndex = monthIndex - 1;
    const cellYear = prevMonthIndex < 0 ? year - 1 : year;
    const cellMonthIndex = prevMonthIndex < 0 ? 11 : prevMonthIndex;
    cells.push({
      day,
      year: cellYear,
      monthIndex: cellMonthIndex,
      iso: toIsoDate(cellYear, cellMonthIndex, day),
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      day,
      year,
      monthIndex,
      iso: toIsoDate(year, monthIndex, day),
      isCurrentMonth: true,
    });
  }

  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    const nextMonthIndex = monthIndex + 1;
    const cellYear = nextMonthIndex > 11 ? year + 1 : year;
    const cellMonthIndex = nextMonthIndex > 11 ? 0 : nextMonthIndex;
    cells.push({
      day: nextDay,
      year: cellYear,
      monthIndex: cellMonthIndex,
      iso: toIsoDate(cellYear, cellMonthIndex, nextDay),
      isCurrentMonth: false,
    });
    nextDay += 1;
  }

  const weeks: CalendarCell[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

export function getMonthOptions(): Array<{ value: number; label: string }> {
  return Array.from({ length: 12 }, (_, monthIndex) => ({
    value: monthIndex,
    label: new Date(2000, monthIndex, 1).toLocaleDateString("es-MX", { month: "long" }),
  }));
}

export function getBookingYearRange(minIso: string, yearsAhead = 5): number[] {
  const minYear = parseIsoDate(minIso).year;
  const maxYear = new Date().getFullYear() + yearsAhead;
  return Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index);
}

/** Inclusive ISO date range (local calendar, no UTC drift). */
export function enumerateIsoDates(from: string, to: string): string[] {
  const start = parseIsoDate(from);
  const end = parseIsoDate(to);
  const cursor = new Date(start.year, start.monthIndex, start.day);
  const endDate = new Date(end.year, end.monthIndex, end.day);
  const dates: string[] = [];

  while (cursor <= endDate) {
    dates.push(toIsoDate(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export function previewBookingCode(
  portCode: string,
  lineCode: string,
  vesselName: string,
  isoDate: string,
): string {
  const compact = vesselName.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const vesselPart = compact || "VESSEL";
  const datePart = isoDate.replace(/-/g, "");
  return `${portCode.toUpperCase()}-${lineCode.toUpperCase()}-${vesselPart}-${datePart}`;
}
