import { formatIsoDateLabel } from "@/lib/bookingDates";
import type { ActiveFilterChip } from "@/views/BookingsView/bookingsActiveFilterChips";
import { isDefaultReportDateRange } from "./reportsFilterDefaults";
import type { ReportPaxBasis, ReportTab } from "./reportsFilterQuery";

export function buildReportsActiveFilterChips(input: {
  tab?: ReportTab;
  portLabel?: string | null;
  dateFrom: string;
  dateTo: string;
  withoutLta: boolean;
  paxBasis: ReportPaxBasis;
  years?: number[];
  tagLabels?: string[];
  shippingLineLabel?: string | null;
}): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  const isSolicitudes = input.tab === "solicitudes_port";

  if (input.portLabel) {
    chips.push({
      id: "port",
      label: input.portLabel,
      icon: "port",
    });
  }

  if (
    !isSolicitudes &&
    !isDefaultReportDateRange(input.dateFrom, input.dateTo)
  ) {
    chips.push({
      id: "dates",
      label: `${formatIsoDateLabel(input.dateFrom, "short")} – ${formatIsoDateLabel(input.dateTo, "short")}`,
      icon: "dates",
    });
  }

  if (input.years?.length) {
    chips.push({
      id: "years",
      label: `Años: ${input.years.join(", ")}`,
      icon: "dates",
    });
  }

  if (input.shippingLineLabel) {
    chips.push({
      id: "shipping-line",
      label: input.shippingLineLabel,
      icon: "port",
    });
  }

  if (input.tagLabels?.length) {
    chips.push({
      id: "tags",
      label:
        input.tagLabels.length === 1
          ? input.tagLabels[0]
          : `Tags: ${input.tagLabels.join(", ")}`,
      icon: "lta",
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
      label: "PAX: Cap. máx.",
      icon: "dates",
    });
  }

  return chips;
}

export function reportsHasActiveFilters(input: {
  tab?: ReportTab;
  portFilter: number;
  dateFrom: string;
  dateTo: string;
  withoutLta: boolean;
  paxBasis: ReportPaxBasis;
  years?: number[];
  tagIds?: number[];
  shippingLineId?: number;
}): boolean {
  if (input.tab === "solicitudes_port") {
    return (
      input.portFilter > 0 ||
      input.withoutLta ||
      input.paxBasis !== "planned" ||
      (input.years?.length ?? 0) > 0 ||
      (input.tagIds?.length ?? 0) > 0 ||
      (input.shippingLineId ?? 0) > 0
    );
  }
  return (
    input.portFilter > 0 ||
    input.withoutLta ||
    input.paxBasis !== "planned" ||
    (input.years?.length ?? 0) > 0 ||
    (input.tagIds?.length ?? 0) > 0 ||
    (input.shippingLineId ?? 0) > 0 ||
    !isDefaultReportDateRange(input.dateFrom, input.dateTo)
  );
}
