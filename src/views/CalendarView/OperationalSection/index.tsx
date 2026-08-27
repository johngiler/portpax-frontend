"use client";

import type { ConflictTypeFilterValue } from "@/lib/bookingConflictLabels";
import type { CalendarViewModeQuery } from "@/lib/viewFilterQuery";
import type { BookingStatusFilterValue } from "@/types/booking";
import type { CalendarSeason } from "./calendarOpsUtils";
import UnifiedCalendarCard from "./UnifiedCalendarCard";

type CalendarConflictFilters = {
  has_conflict?: boolean;
  conflict_severity?: "yellow" | "red" | "green";
  conflict_type?: ConflictTypeFilterValue;
};

type OperationalSectionProps = {
  mode: CalendarViewModeQuery;
  onModeChange: (mode: CalendarViewModeQuery) => void;
  /** Empty = all ports in one unified card. */
  portIds: number[];
  portLabel: string;
  shippingLineId: number;
  vesselId: number;
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
  shippingLineId,
  vesselId,
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
    shippingLineId > 0 ||
    vesselId > 0 ||
    positionId > 0 ||
    statuses.length > 0 ||
    Boolean(search.trim()) ||
    portIds.length > 0 ||
    Boolean(callDates?.length) ||
    conflictFilters.has_conflict !== undefined ||
    Boolean(conflictFilters.conflict_severity) ||
    Boolean(conflictFilters.conflict_type);

  return (
    <UnifiedCalendarCard
      mode={mode}
      onModeChange={onModeChange}
      portIds={portIds}
      portLabel={portLabel}
      shippingLineId={shippingLineId}
      vesselId={vesselId}
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
