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
