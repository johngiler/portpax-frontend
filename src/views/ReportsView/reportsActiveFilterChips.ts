import { formatIsoDateLabel } from "@/lib/bookingDates";
import type { ActiveFilterChip } from "@/views/BookingsView/bookingsActiveFilterChips";
import { isDefaultReportDateRange } from "./reportsFilterDefaults";

export function buildReportsActiveFilterChips(input: {
  portLabel?: string | null;
  dateFrom: string;
  dateTo: string;
  withoutLta: boolean;
}): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (input.portLabel) {
    chips.push({
      id: "port",
      label: input.portLabel,
      icon: "port",
    });
  }

  if (!isDefaultReportDateRange(input.dateFrom, input.dateTo)) {
    chips.push({
      id: "dates",
      label: `${formatIsoDateLabel(input.dateFrom, "short")} – ${formatIsoDateLabel(input.dateTo, "short")}`,
      icon: "dates",
    });
  }

  if (input.withoutLta) {
    chips.push({
      id: "without-lta",
      label: "Sin LTA / CL / LTD",
      icon: "lta",
    });
  }

  return chips;
}

export function reportsHasActiveFilters(input: {
  portFilter: number;
  dateFrom: string;
  dateTo: string;
  withoutLta: boolean;
}): boolean {
  return (
    input.portFilter > 0 ||
    input.withoutLta ||
    !isDefaultReportDateRange(input.dateFrom, input.dateTo)
  );
}
