"use client";

import type { CalendarViewModeQuery } from "@/lib/viewFilterQuery";
import type { BookingListStatusFilter } from "@/types/booking";
import UnifiedCalendarCard from "./UnifiedCalendarCard";

type OperationalSectionProps = {
  mode: CalendarViewModeQuery;
  onModeChange: (mode: CalendarViewModeQuery) => void;
  /** 0 = all ports in one unified card. */
  portId: number;
  portLabel: string;
  shippingLineId: number;
  vesselId: number;
  status: BookingListStatusFilter;
  positionId: number;
  search: string;
  weekAnchor: string;
  onWeekAnchorChange: (iso: string) => void;
  year: number;
  onYearChange: (year: number) => void;
  monthIndex: number;
  onMonthChange: (monthIndex: number) => void;
  onClearFilters?: () => void;
};

export default function OperationalSection({
  mode,
  onModeChange,
  portId,
  portLabel,
  shippingLineId,
  vesselId,
  status,
  positionId,
  search,
  weekAnchor,
  onWeekAnchorChange,
  year,
  onYearChange,
  monthIndex,
  onMonthChange,
  onClearFilters,
}: OperationalSectionProps) {
  const hasFilters =
    shippingLineId > 0 ||
    vesselId > 0 ||
    positionId > 0 ||
    Boolean(status) ||
    Boolean(search.trim()) ||
    portId > 0;

  return (
    <UnifiedCalendarCard
      mode={mode}
      onModeChange={onModeChange}
      portId={portId}
      portLabel={portLabel}
      shippingLineId={shippingLineId}
      vesselId={vesselId}
      status={status}
      positionId={positionId}
      search={search}
      hasFilters={hasFilters}
      onClearFilters={onClearFilters}
      weekAnchor={weekAnchor}
      onWeekAnchorChange={onWeekAnchorChange}
      year={year}
      onYearChange={onYearChange}
      monthIndex={monthIndex}
      onMonthChange={onMonthChange}
    />
  );
}
