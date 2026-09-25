import { formatIsoDateLabel } from "@/lib/bookingDates";
import type { ActiveFilterChip } from "@/views/BookingsView/bookingsActiveFilterChips";
import { isDefaultReportDateRange } from "./reportsFilterDefaults";
import {
  defaultMovementYear,
  defaultWeeklyYearWeek,
  type ReportPaxBasis,
  type ReportTab,
} from "./reportsFilterQuery";

export function buildReportsActiveFilterChips(input: {
  tab?: ReportTab;
  portLabel?: string | null;
  dateFrom: string;
  dateTo: string;
  withoutLta: boolean;
  paxBasis: ReportPaxBasis;
  years?: number[];
  week?: number;
  tagLabels?: string[];
  shippingLineGroupLabel?: string | null;
  shippingLineLabel?: string | null;
}): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  const isSolicitudes = input.tab === "solicitudes_port";
  const isMovements = input.tab === "booking_movements";
  const isWeekly = input.tab === "weekly_report";
  const movementYear = input.years?.[0];
  const weeklyDefault = defaultWeeklyYearWeek();
  const movementYearActive =
    isMovements &&
    movementYear != null &&
    movementYear !== defaultMovementYear();
  const weeklyYearActive =
    isWeekly &&
    movementYear != null &&
    movementYear !== weeklyDefault.year;
  const weeklyWeekActive =
    isWeekly &&
    input.week != null &&
    (movementYear !== weeklyDefault.year || input.week !== weeklyDefault.week);

  if (!isMovements && !isWeekly && input.portLabel) {
    chips.push({
      id: "port",
      label: input.portLabel,
      icon: "port",
    });
  }

  if (
    !isSolicitudes &&
    !isMovements &&
    !isWeekly &&
    !isDefaultReportDateRange(input.dateFrom, input.dateTo)
  ) {
    chips.push({
      id: "dates",
      label: `${formatIsoDateLabel(input.dateFrom, "short")} – ${formatIsoDateLabel(input.dateTo, "short")}`,
      icon: "dates",
    });
  }

  if (isMovements) {
    if (movementYearActive) {
      chips.push({
        id: "years",
        label: `Año: ${movementYear}`,
        icon: "dates",
      });
    }
  } else   if (isWeekly) {
    if (weeklyYearActive || weeklyWeekActive) {
      chips.push({
        id: "years",
        label: `Año ${movementYear} · Semana ${input.week}`,
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
        label: "PAX: Cap. máx.",
        icon: "dates",
      });
    }
  } else if (input.years?.length) {
    chips.push({
      id: "years",
      label: `Años: ${input.years.join(", ")}`,
      icon: "dates",
    });
  }

  if (!isMovements && !isWeekly && input.shippingLineGroupLabel) {
    chips.push({
      id: "shipping-line-group",
      label: input.shippingLineGroupLabel,
      icon: "shipping_line",
    });
  }

  if (!isMovements && !isWeekly && input.shippingLineLabel) {
    chips.push({
      id: "shipping-line",
      label: input.shippingLineLabel,
      icon: "shipping_line",
    });
  }

  if (!isMovements && !isWeekly && input.tagLabels?.length) {
    chips.push({
      id: "tags",
      label:
        input.tagLabels.length === 1
          ? input.tagLabels[0]
          : `Tags: ${input.tagLabels.join(", ")}`,
      icon: "lta",
    });
  }

  if (!isMovements && !isWeekly && input.withoutLta) {
    chips.push({
      id: "without-lta",
      label: "Sin LTA",
      icon: "lta",
    });
  }

  if (!isMovements && !isWeekly && input.paxBasis === "capacity") {
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
  portIds?: number[];
  dateFrom: string;
  dateTo: string;
  withoutLta: boolean;
  paxBasis: ReportPaxBasis;
  years?: number[];
  week?: number;
  tagIds?: number[];
  shippingLineGroupId?: number;
  shippingLineId?: number;
}): boolean {
  if (input.tab === "booking_movements") {
    const year = input.years?.[0];
    return year != null && year !== defaultMovementYear();
  }
  if (input.tab === "weekly_report") {
    const weekly = defaultWeeklyYearWeek();
    const year = input.years?.[0];
    return (
      (year != null && year !== weekly.year) ||
      (input.week != null && input.week !== weekly.week) ||
      Boolean(input.withoutLta) ||
      input.paxBasis !== "planned"
    );
  }
  if (input.tab === "solicitudes_port") {
    return (
      input.portFilter > 0 ||
      input.withoutLta ||
      input.paxBasis !== "planned" ||
      (input.years?.length ?? 0) > 0 ||
      (input.tagIds?.length ?? 0) > 0 ||
      (input.shippingLineGroupId ?? 0) > 0 ||
      (input.shippingLineId ?? 0) > 0
    );
  }
  return (
    input.portFilter > 0 ||
    (input.tab === "carrier_panorama" && (input.portIds?.length ?? 0) > 0) ||
    input.withoutLta ||
    input.paxBasis !== "planned" ||
    (input.years?.length ?? 0) > 0 ||
    (input.tagIds?.length ?? 0) > 0 ||
    (input.shippingLineId ?? 0) > 0 ||
    (input.shippingLineGroupId ?? 0) > 0 ||
    !isDefaultReportDateRange(input.dateFrom, input.dateTo)
  );
}
