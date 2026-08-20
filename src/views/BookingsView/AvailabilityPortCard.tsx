"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import { useAvailabilityInfinite } from "@/hooks/swr/useAvailabilityInfinite";
import type { AvailabilityListFilters } from "@/hooks/swr/useAvailabilityInfinite";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { toIsoDate } from "@/lib/bookingDates";
import type { AvailabilityHeatModeQuery } from "@/lib/viewFilterQuery";
import type { AvailabilityReport } from "@/services/bookings/bookingService";
import AvailabilityChartSection from "./AvailabilityChartSection";
import BookingsViewSkeleton from "./BookingsViewSkeleton";
import { availabilityFocusIsActive } from "./availabilityCallFilter";

type AvailabilityPortDisplayState = "loading" | "visible" | "empty" | "error";

type AvailabilityPortCardProps = {
  portId: number;
  dateFrom: string;
  dateTo: string;
  /** When set, only these ISO dates are shown in the grid. */
  dateAllowlist?: string[] | null;
  /** Disponibilidad = gaps; ocupación = only occupied days. */
  heatMode?: AvailabilityHeatModeQuery;
  /** Occupancy only: exact ships-per-day (0 = any occupied day). */
  density?: number;
  filters?: AvailabilityListFilters;
  canBook?: boolean;
  returnTo?: string | null;
  /** Shift grid start; parent recalculates consecutive range. */
  onStartDateChange?: (isoDate: string) => void;
  onDisplayStateChange?: (
    portId: number,
    state: AvailabilityPortDisplayState,
  ) => void;
};

/** Max auto-pages to skip empty occupancy prefix (~90 days). */
const MAX_OCCUPANCY_PREFIX_PAGES = 3;

function todayIsoLocal(): string {
  const d = new Date();
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

function rowHasOccupancy(
  row: AvailabilityReport["rows"][number],
): boolean {
  return row.cells.some((calls) => calls.length > 0);
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
  density = 0,
  filters = {},
  canBook = false,
  returnTo = null,
  onStartDateChange,
  onDisplayStateChange,
}: AvailabilityPortCardProps) {
  const todayIso = todayIsoLocal();
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const occupancyPrefixPagesRef = useRef(0);
  const allowSet = useMemo(
    () => (dateAllowlist?.length ? new Set(dateAllowlist) : null),
    [dateAllowlist],
  );
  const isOccupancy = heatMode === "occupancy";
  const densityFilter = isOccupancy && density >= 1 ? density : 0;
  const statusFilters = filters.statuses;
  const chartFocus = useMemo(
    () => ({
      statuses: statusFilters,
      vesselId: filters.vessel ?? 0,
      shippingLineId: filters.shipping_line ?? 0,
      positionId: filters.position ?? 0,
      has_conflict: filters.has_conflict,
      conflict_severity: filters.conflict_severity,
      conflict_type: filters.conflict_type,
    }),
    [
      statusFilters,
      filters.vessel,
      filters.shipping_line,
      filters.position,
      filters.has_conflict,
      filters.conflict_severity,
      filters.conflict_type,
    ],
  );
  const focusActive = availabilityFocusIsActive(chartFocus);

  const listFilters = useMemo((): AvailabilityListFilters => {
    // Soft-focus filters go to the API: matching days + neighbors on those days.
    const base: AvailabilityListFilters = { ...filters };
    if (densityFilter >= 1) {
      base.ships_per_day = densityFilter;
    } else if (isOccupancy) {
      base.occupied_only = true;
    }
    return base;
  }, [filters, densityFilter, isOccupancy]);

  const { data, totalDays, hasMore, isLoading, loadingMore, error, loadMore } =
    useAvailabilityInfinite(portId, dateFrom, dateTo, true, listFilters);

  useEffect(() => {
    occupancyPrefixPagesRef.current = 0;
  }, [portId, dateFrom, dateTo, isOccupancy, densityFilter, chartFocus]);

  // With an Excel allowlist, keep paging until the requested dates are loaded.
  useEffect(() => {
    if (densityFilter > 0 || focusActive) return;
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
    densityFilter,
    focusActive,
  ]);

  // Occupancy (no density / soft-focus): skip a short empty prefix only.
  useEffect(() => {
    if (!isOccupancy || densityFilter > 0 || allowSet || focusActive) return;
    if (!data || !hasMore || loadingMore || isLoading) return;
    if (data.rows.some((row) => rowHasOccupancy(row))) return;
    if (occupancyPrefixPagesRef.current >= MAX_OCCUPANCY_PREFIX_PAGES) return;
    occupancyPrefixPagesRef.current += 1;
    loadMore();
  }, [
    isOccupancy,
    densityFilter,
    allowSet,
    focusActive,
    data,
    hasMore,
    loadingMore,
    isLoading,
    loadMore,
  ]);

  const displayData = useMemo((): AvailabilityReport | null => {
    if (!data) return null;
    let rows = data.rows;
    if (allowSet && densityFilter < 1 && !focusActive) {
      rows = rows.filter((row) => allowSet.has(row.date));
    }
    // Density / soft-focus: server already returns matching days only.
    if (isOccupancy && densityFilter < 1 && !focusActive) {
      rows = rows.filter((row) => rowHasOccupancy(row));
    }
    return { ...data, rows };
  }, [
    data,
    allowSet,
    isOccupancy,
    densityFilter,
    focusActive,
  ]);

  const stillLoadingAllowlist =
    densityFilter < 1 &&
    !focusActive &&
    Boolean(allowSet) &&
    hasMore &&
    (loadingMore || isLoading);
  const stillLoadingOccupancyPrefix =
    isOccupancy &&
    densityFilter === 0 &&
    !allowSet &&
    !focusActive &&
    hasMore &&
    occupancyPrefixPagesRef.current < MAX_OCCUPANCY_PREFIX_PAGES &&
    (loadingMore || isLoading) &&
    !(data?.rows.some((row) => rowHasOccupancy(row)));
  const stillLoadingFocus =
    stillLoadingAllowlist || stillLoadingOccupancyPrefix;

  const displayTotal =
    densityFilter > 0 || isOccupancy || focusActive
      ? totalDays
      : allowSet
        ? allowSet.size
        : totalDays;
  const displayHasMore =
    allowSet && densityFilter < 1 && !isOccupancy && !focusActive
      ? stillLoadingFocus
      : hasMore;
  const footerLoadedCount = displayData?.rows.length ?? 0;
  const itemLabel =
    densityFilter > 0
      ? `días con ${densityFilter} barco(s)`
      : isOccupancy || focusActive
        ? "días ocupados"
        : "días";

  const hidden = useMemo(() => {
    if (!displayData) return false;
    if (stillLoadingFocus) return false;
    // Occupancy / soft-focus only return days with matching focus calls —
    // do not require a free slot (availability default).
    if (isOccupancy || focusActive) {
      return (
        displayData.columns.length === 0 ||
        (displayData.rows.length === 0 && !hasMore)
      );
    }
    return !shouldShowAvailabilityPort(displayData, todayIso);
  }, [
    displayData,
    todayIso,
    stillLoadingFocus,
    isOccupancy,
    focusActive,
    hasMore,
  ]);

  const isInitialLoading =
    (isLoading && !data) ||
    (stillLoadingFocus && (!displayData || displayData.rows.length === 0));
  const isEmpty =
    !isInitialLoading &&
    !error &&
    (hidden ||
      !displayData ||
      displayData.columns.length === 0 ||
      (displayData.rows.length === 0 && !stillLoadingFocus && !hasMore));

  useLayoutEffect(() => {
    if (!onDisplayStateChange) return;
    if (isInitialLoading) {
      onDisplayStateChange(portId, "loading");
      return;
    }
    if (error && !data) {
      onDisplayStateChange(portId, "error");
      return;
    }
    if (isEmpty) {
      onDisplayStateChange(portId, "empty");
      return;
    }
    onDisplayStateChange(portId, "visible");
  }, [
    onDisplayStateChange,
    portId,
    isInitialLoading,
    error,
    data,
    isEmpty,
  ]);

  if (isInitialLoading) {
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

  if (isEmpty || !displayData) {
    return null;
  }

  return (
    <AvailabilityChartSection
      data={displayData}
      titlePrefix={isOccupancy ? "Ocupación" : "Disponibilidad"}
      statusFilter={statusFilters}
      vesselFocusId={filters.vessel ?? 0}
      shippingLineFocusId={filters.shipping_line ?? 0}
      positionFocusId={filters.position ?? 0}
      conflictFocus={{
        has_conflict: filters.has_conflict,
        conflict_severity: filters.conflict_severity,
        conflict_type: filters.conflict_type,
      }}
      scrollRootRef={scrollRootRef}
      canBook={canBook && !isOccupancy}
      returnTo={returnTo}
      onStartDateChange={isOccupancy || focusActive ? undefined : onStartDateChange}
      footer={
        <InfiniteScrollFooter
          hasMore={displayHasMore}
          loading={loadingMore || stillLoadingFocus}
          onLoadMore={loadMore}
          loadedCount={footerLoadedCount}
          totalCount={displayTotal}
          itemLabel={itemLabel}
          scrollRootRef={scrollRootRef}
          rootMargin="80px 0px"
          className="mt-0 sm:mt-0"
        />
      }
    />
  );
}
