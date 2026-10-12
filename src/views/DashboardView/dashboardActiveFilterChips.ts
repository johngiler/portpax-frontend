import { formatIsoDateLabel } from "@/lib/bookingDates";
import type { DashboardCarrierFilter } from "@/types/dashboard";
import type { ActiveFilterChip } from "@/views/BookingsView/bookingsActiveFilterChips";
import type { ReportPaxBasis } from "@/views/ReportsView/reportsFilterQuery";

export function buildDashboardActiveFilterChips(input: {
  portLabel: string | null;
  shippingLineGroupLabel?: string | null;
  carrierLabel: string | null;
  dateFrom: string;
  dateTo: string;
  defaultDateFrom: string;
  defaultDateTo: string;
  withoutLta?: boolean;
  paxBasis?: ReportPaxBasis;
}): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (input.portLabel) {
    chips.push({
      id: "port",
      label: input.portLabel,
      icon: "port",
    });
  }

  if (input.shippingLineGroupLabel) {
    chips.push({
      id: "shipping-line-group",
      label: input.shippingLineGroupLabel,
      icon: "shipping_line",
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

  if (input.withoutLta) {
    chips.push({
      id: "without-lta",
      label: "Sin LTA",
      icon: "lta",
    });
  }

  if (input.paxBasis === "capacity") {
    chips.push({
      id: "pax-basis",
      label: "Base PAX: Cap. máx.",
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
  withoutLta?: boolean;
  paxBasis?: ReportPaxBasis;
}): boolean {
  return (
    input.portIds.length > 0 ||
    input.carrier.type !== "all" ||
    input.dateFrom !== input.defaultDateFrom ||
    input.dateTo !== input.defaultDateTo ||
    Boolean(input.withoutLta) ||
    input.paxBasis === "capacity"
  );
}

export function dashboardTitleYear(dateFrom: string, dateTo: string): string {
  const fromYear = Number(dateFrom.slice(0, 4));
  const toYear = Number(dateTo.slice(0, 4));
  if (!fromYear || !toYear) return "";
  if (fromYear === toYear) return String(fromYear);
  return `${fromYear}–${toYear}`;
}
