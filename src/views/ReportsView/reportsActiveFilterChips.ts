import { formatIsoDateLabel } from "@/lib/bookingDates";
import type { ActiveFilterChip } from "@/views/BookingsView/bookingsActiveFilterChips";
import { isDefaultReportDateRange } from "./reportsFilterDefaults";
import type { ReportPaxBasis } from "./reportsFilterQuery";

export function buildReportsActiveFilterChips(input: {
  portLabel?: string | null;
  dateFrom: string;
  dateTo: string;
  withoutLta: boolean;
  paxBasis: ReportPaxBasis;
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

  if (input.paxBasis === "capacity") {
    chips.push({
      id: "pax-basis",
      label: "PAX: Cap. máx.",
      icon: "dates",
    });
  }

  return chips;
}

export function reportsHasActiveFilters(input: {
  portFilter: number;
  dateFrom: string;
  dateTo: string;
  withoutLta: boolean;
  paxBasis: ReportPaxBasis;
}): boolean {
  return (
    input.portFilter > 0 ||
    input.withoutLta ||
    input.paxBasis !== "planned" ||
    !isDefaultReportDateRange(input.dateFrom, input.dateTo)
  );
}
