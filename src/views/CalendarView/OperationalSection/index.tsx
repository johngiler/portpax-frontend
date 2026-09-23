"use client";

import type { ConflictTypeFilterValue } from "@/lib/bookingConflictLabels";
import type { CalendarViewModeQuery } from "@/lib/viewFilterQuery";
import type {
  BookingStatusFilterValue,
  CancellationReason,
} from "@/types/booking";
import type { CalendarSeason } from "./calendarOpsUtils";
import UnifiedCalendarCard from "./UnifiedCalendarCard";

type CalendarConflictFilters = {
  has_conflict?: boolean;
  conflict_severity?: "yellow" | "red" | "green";
  conflict_type?: ConflictTypeFilterValue;
  first_arrival?: boolean;
  cancellation_reason?: CancellationReason | "";
};

type OperationalSectionProps = {
  mode: CalendarViewModeQuery;
  onModeChange: (mode: CalendarViewModeQuery) => void;
  /** Empty = all ports in one unified card. */
  portIds: number[];
  portLabel: string;
  shippingLineGroupId: number;
  shippingLineId: number;
  vesselId: number;
  tagIds?: number[];
  statuses: BookingStatusFilterValue[];
  positionId: number;
  search: string;
  conflictFilters?: CalendarConflictFilters;
  callDates?: string[] | null;
  weekAnchor: string;
  onWeekAnchorChange: (iso: string) => void;
  year: number;
  onYearChange: (year: number) => void;
  monthIndex: number;
  onMonthChange: (monthIndex: number) => void;
  season: CalendarSeason;
  onSeasonChange: (season: CalendarSeason) => void;
  onClearFilters?: () => void;
};

export default function OperationalSection({
  mode,
  onModeChange,
  portIds,
  portLabel,
  shippingLineGroupId,
  shippingLineId,
  vesselId,
  tagIds = [],
  statuses,
  positionId,
  search,
  conflictFilters = {},
  callDates = null,
  weekAnchor,
  onWeekAnchorChange,
  year,
  onYearChange,
  monthIndex,
  onMonthChange,
  season,
  onSeasonChange,
  onClearFilters,
}: OperationalSectionProps) {
  const hasFilters =
    shippingLineGroupId > 0 ||
    shippingLineId > 0 ||
    vesselId > 0 ||
    tagIds.length > 0 ||
    positionId > 0 ||
    statuses.length > 0 ||
    Boolean(search.trim()) ||
    portIds.length > 0 ||
    Boolean(callDates?.length) ||
    conflictFilters.has_conflict !== undefined ||
    Boolean(conflictFilters.conflict_severity) ||
    Boolean(conflictFilters.conflict_type) ||
    conflictFilters.first_arrival !== undefined ||
    Boolean(conflictFilters.cancellation_reason);

  return (
    <UnifiedCalendarCard
      mode={mode}
      onModeChange={onModeChange}
      portIds={portIds}
      portLabel={portLabel}
      shippingLineGroupId={shippingLineGroupId}
      shippingLineId={shippingLineId}
      vesselId={vesselId}
      tagIds={tagIds}
      statuses={statuses}
      positionId={positionId}
      search={search}
      conflictFilters={conflictFilters}
      callDates={callDates}
      hasFilters={hasFilters}
      onClearFilters={onClearFilters}
      weekAnchor={weekAnchor}
      onWeekAnchorChange={onWeekAnchorChange}
      year={year}
      onYearChange={onYearChange}
      monthIndex={monthIndex}
      onMonthChange={onMonthChange}
      season={season}
      onSeasonChange={onSeasonChange}
    />
  );
}
