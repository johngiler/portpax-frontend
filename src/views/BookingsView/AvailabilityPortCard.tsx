"use client";

import { useEffect, useMemo, useRef } from "react";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import { useAvailabilityInfinite } from "@/hooks/swr/useAvailabilityInfinite";
import type { AvailabilityListFilters } from "@/hooks/swr/useAvailabilityInfinite";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { toIsoDate } from "@/lib/bookingDates";
import type { AvailabilityHeatModeQuery } from "@/lib/viewFilterQuery";
import type { AvailabilityReport } from "@/services/bookings/bookingService";
import AvailabilityChartSection from "./AvailabilityChartSection";
import BookingsViewSkeleton from "./BookingsViewSkeleton";
import { filterAvailabilityCalls } from "./availabilityCallFilter";
import { bookingTodayIso } from "@/types/booking";

type AvailabilityPortCardProps = {
  portId: number;
  dateFrom: string;
  dateTo: string;
  /** When set, only these ISO dates are shown in the grid. */
  dateAllowlist?: string[] | null;
  /** Disponibilidad = gaps; ocupación = only occupied days. */
  heatMode?: AvailabilityHeatModeQuery;
  filters?: AvailabilityListFilters;
  canBook?: boolean;
  returnTo?: string | null;
  /** Shift grid start; parent recalculates consecutive range. */
  onStartDateChange?: (isoDate: string) => void;
};

function todayIsoLocal(): string {
  const d = new Date();
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

function rowHasOccupancy(
  row: AvailabilityReport["rows"][number],
  statusFilters?: string[],
  todayIso = bookingTodayIso(),
): boolean {
  return row.cells.some((calls) => {
    if (!statusFilters?.length) return calls.length > 0;
    return (
      filterAvailabilityCalls(calls, row.date, statusFilters, todayIso).length >
      0
    );
  });
}

/** Hide ports with no pier/anchorage columns or no free future slots in the loaded window. */
function shouldShowAvailabilityPort(
  report: AvailabilityReport,
  todayIso: string,
): boolean {
  if (report.columns.length === 0) return false;
  return report.rows.some(
    (row) =>
      row.date >= todayIso &&
      row.cells.some((calls) => calls.length === 0),
  );
}

export default function AvailabilityPortCard({
  portId,
  dateFrom,
  dateTo,
  dateAllowlist = null,
  heatMode = "availability",
  filters = {},
  canBook = false,
  returnTo = null,
  onStartDateChange,
}: AvailabilityPortCardProps) {
  const todayIso = todayIsoLocal();
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const allowSet = useMemo(
    () => (dateAllowlist?.length ? new Set(dateAllowlist) : null),
    [dateAllowlist],
  );
  const isOccupancy = heatMode === "occupancy";
  const statusFilters = filters.statuses;

  const { data, totalDays, hasMore, isLoading, loadingMore, error, loadMore } =
    useAvailabilityInfinite(portId, dateFrom, dateTo, true, filters);

  // With an Excel allowlist, keep paging until the requested dates are loaded.
  useEffect(() => {
    if (!allowSet || !data || !hasMore || loadingMore || isLoading) return;
    const loaded = new Set(data.rows.map((row) => row.date));
    const missing = [...allowSet].some(
      (iso) => iso >= dateFrom && iso <= dateTo && !loaded.has(iso),
    );
    if (missing) loadMore();
  }, [
    allowSet,
    data,
    hasMore,
    loadingMore,
    isLoading,
    dateFrom,
    dateTo,
    loadMore,
  ]);

  // Occupancy: skip empty prefixes until the first occupied day (or end of range).
  useEffect(() => {
    if (!isOccupancy || allowSet || !data || !hasMore || loadingMore || isLoading)
      return;
    if (data.rows.some((row) => rowHasOccupancy(row, statusFilters, todayIso)))
      return;
    loadMore();
  }, [
    isOccupancy,
    allowSet,
    data,
    hasMore,
    loadingMore,
    isLoading,
    loadMore,
    statusFilters,
    todayIso,
  ]);

  const displayData = useMemo((): AvailabilityReport | null => {
    if (!data) return null;
    let rows = data.rows;
    if (allowSet) {
      rows = rows.filter((row) => allowSet.has(row.date));
    }
    if (isOccupancy) {
      rows = rows.filter((row) =>
        rowHasOccupancy(row, statusFilters, todayIso),
      );
    }
    return { ...data, rows };
  }, [data, allowSet, isOccupancy, statusFilters, todayIso]);

  const stillLoadingAllowlist =
    Boolean(allowSet) && hasMore && (loadingMore || isLoading);
  const stillLoadingOccupancyPrefix =
    isOccupancy &&
    !allowSet &&
    hasMore &&
    (loadingMore || isLoading) &&
    !(data?.rows.some((row) => rowHasOccupancy(row, statusFilters, todayIso)));
  const stillLoadingFocus = stillLoadingAllowlist || stillLoadingOccupancyPrefix;

  const displayTotal = allowSet ? allowSet.size : totalDays;
  const displayHasMore = allowSet ? stillLoadingFocus : hasMore;
  const footerLoadedCount = isOccupancy
    ? (data?.rows.length ?? 0)
    : displayData?.rows.length ?? 0;

  const hidden = useMemo(() => {
    if (!displayData) return false;
    if (stillLoadingFocus) return false;
    if (isOccupancy) {
      return (
        displayData.columns.length === 0 ||
        (displayData.rows.length === 0 && !hasMore)
      );
    }
    return !shouldShowAvailabilityPort(displayData, todayIso);
  }, [displayData, todayIso, stillLoadingFocus, isOccupancy, hasMore]);

  if ((isLoading && !data) || (stillLoadingFocus && (!displayData || displayData.rows.length === 0))) {
    return (
      <BookingsViewSkeleton variant="availability" availabilityCards={1} />
    );
  }

  if (error && !data) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
        {getApiErrorMessage(error, "No se pudo cargar la disponibilidad.")}
      </p>
    );
  }

  if (
    hidden ||
    !displayData ||
    displayData.columns.length === 0 ||
    (displayData.rows.length === 0 && !stillLoadingFocus)
  ) {
    return null;
  }

  return (
    <AvailabilityChartSection
      data={displayData}
      titlePrefix={isOccupancy ? "Ocupación" : "Disponibilidad"}
      statusFilter={statusFilters}
      scrollRootRef={scrollRootRef}
      canBook={canBook && !isOccupancy}
      returnTo={returnTo}
      onStartDateChange={isOccupancy ? undefined : onStartDateChange}
      footer={
        <InfiniteScrollFooter
          hasMore={displayHasMore}
          loading={loadingMore || stillLoadingFocus}
          onLoadMore={loadMore}
          loadedCount={footerLoadedCount}
          totalCount={displayTotal}
          itemLabel={isOccupancy ? "días del rango" : "días"}
          scrollRootRef={scrollRootRef}
          rootMargin="80px 0px"
          className="mt-0 sm:mt-0"
        />
      }
    />
  );
}
