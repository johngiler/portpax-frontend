import { parseIsoDate, toIsoDate } from "@/lib/bookingDates";

export function defaultReportDateFrom(): string {
  const y = new Date().getFullYear();
  return toIsoDate(y, 0, 1);
}

/** End of the fourth calendar year after `from` (e.g. 2026-01-01 → 2030-12-31). */
export function defaultReportDateTo(from = defaultReportDateFrom()): string {
  const { year } = parseIsoDate(from);
  return toIsoDate(year + 4, 11, 31);
}

export function isDefaultReportDateRange(dateFrom: string, dateTo: string): boolean {
  const defFrom = defaultReportDateFrom();
  return dateFrom === defFrom && dateTo === defaultReportDateTo(defFrom);
}
