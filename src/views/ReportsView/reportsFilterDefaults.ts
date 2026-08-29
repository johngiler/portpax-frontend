import { addYearsToIsoDate, toIsoDate } from "@/lib/bookingDates";

export function defaultReportDateFrom(): string {
  const y = new Date().getFullYear();
  return toIsoDate(y, 0, 1);
}

export function defaultReportDateTo(from = defaultReportDateFrom()): string {
  return addYearsToIsoDate(from, 4);
}

export function isDefaultReportDateRange(dateFrom: string, dateTo: string): boolean {
  const defFrom = defaultReportDateFrom();
  return dateFrom === defFrom && dateTo === defaultReportDateTo(defFrom);
}
