/** ISO date string YYYY-MM-DD from local calendar parts (no UTC drift). */
export function toIsoDate(year: number, monthIndex: number, day: number): string {
  const y = String(year);
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(value: string): { year: number; monthIndex: number; day: number } {
  const [y, m, d] = value.split("-").map(Number);
  return { year: y, monthIndex: m - 1, day: d };
}

export function formatIsoDateLabel(value: string, style: "short" | "long" = "long"): string {
  const { year, monthIndex, day } = parseIsoDate(value);
  const date = new Date(year, monthIndex, day);
  return date.toLocaleDateString("es-MX", {
    weekday: style === "long" ? "short" : undefined,
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
  });
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
