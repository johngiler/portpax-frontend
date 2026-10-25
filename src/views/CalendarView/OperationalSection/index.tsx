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
  shippingLineGroupIds?: number[];
  shippingLineIds?: number[];
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
  monthIndexes?: number[];
  onMonthIndexesChange?: (monthIndexes: number[]) => void;
  onSelectMonth?: (monthIndex: number) => void;
  onClearFilters?: () => void;
};

export default function OperationalSection({
  mode,
  onModeChange,
  portIds,
  portLabel,
  shippingLineGroupIds = [],
  shippingLineIds = [],
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
  monthIndexes = [],
  onMonthIndexesChange,
  onSelectMonth,
  onClearFilters,
}: OperationalSectionProps) {
  const hasFilters =
    shippingLineGroupIds.length > 0 ||
    shippingLineIds.length > 0 ||
    vesselId > 0 ||
    tagIds.length > 0 ||
    positionId > 0 ||
    statuses.length > 0 ||
    Boolean(search.trim()) ||
    portIds.length > 0 ||
    Boolean(callDates?.length) ||
    monthIndexes.length > 0 ||
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
      shippingLineGroupIds={shippingLineGroupIds}
      shippingLineIds={shippingLineIds}
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
      monthIndexes={monthIndexes}
      onMonthIndexesChange={onMonthIndexesChange}
      onSelectMonth={onSelectMonth}
    />
  );
}
