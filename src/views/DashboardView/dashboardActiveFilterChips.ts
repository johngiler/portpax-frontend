import { formatIsoDateLabel } from "@/lib/bookingDates";
import type { DashboardCarrierFilter } from "@/types/dashboard";
import type { ActiveFilterChip } from "@/views/BookingsView/bookingsActiveFilterChips";

export function buildDashboardActiveFilterChips(input: {
  portLabel: string | null;
  carrierLabel: string | null;
  dateFrom: string;
  dateTo: string;
  defaultDateFrom: string;
  defaultDateTo: string;
}): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (input.portLabel) {
    chips.push({
      id: "port",
      label: input.portLabel,
      icon: "port",
    });
  }

  if (input.carrierLabel) {
    chips.push({
      id: "line",
      label: input.carrierLabel,
      icon: "shipping_line",
    });
  }

  if (
    input.dateFrom !== input.defaultDateFrom ||
    input.dateTo !== input.defaultDateTo
  ) {
    chips.push({
      id: "dates",
      label: `${formatIsoDateLabel(input.dateFrom, "short")} – ${formatIsoDateLabel(input.dateTo, "short")}`,
      icon: "dates",
    });
  }

  return chips;
}

export function dashboardHasActiveFilters(input: {
  portIds: number[];
  carrier: DashboardCarrierFilter;
  dateFrom: string;
  dateTo: string;
  defaultDateFrom: string;
  defaultDateTo: string;
}): boolean {
  return (
    input.portIds.length > 0 ||
    input.carrier.type !== "all" ||
    input.dateFrom !== input.defaultDateFrom ||
    input.dateTo !== input.defaultDateTo
  );
}

export function dashboardTitleYear(dateFrom: string, dateTo: string): string {
  const fromYear = Number(dateFrom.slice(0, 4));
  const toYear = Number(dateTo.slice(0, 4));
  if (!fromYear || !toYear) return "";
  if (fromYear === toYear) return String(fromYear);
  return `${fromYear}–${toYear}`;
}
