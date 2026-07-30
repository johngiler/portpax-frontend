"use client";

import { useEffect, useMemo, useRef } from "react";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import { useAvailabilityInfinite } from "@/hooks/swr/useAvailabilityInfinite";
import type { AvailabilityListFilters } from "@/hooks/swr/useAvailabilityInfinite";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { toIsoDate } from "@/lib/bookingDates";
import type { AvailabilityReport } from "@/services/bookings/bookingService";
import AvailabilityChartSection from "./AvailabilityChartSection";
import BookingsViewSkeleton from "./BookingsViewSkeleton";

type AvailabilityPortCardProps = {
  portId: number;
  dateFrom: string;
  dateTo: string;
  /** When set, only these ISO dates are shown in the grid. */
  dateAllowlist?: string[] | null;
  filters?: AvailabilityListFilters;
  canBook?: boolean;
  returnTo?: string | null;
};

function todayIsoLocal(): string {
  const d = new Date();
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Hide ports with no pier/anchorage columns or no free future slots in the loaded window. */
function shouldShowPort(
  report: AvailabilityReport,
  todayIso: string,
  hasMoreDays: boolean,
): boolean {
  if (report.columns.length === 0) return false;
  const hasOpen = report.rows.some(
    (row) =>
      row.date >= todayIso &&
      row.cells.some((calls) => calls.length === 0),
  );
  if (hasOpen) return true;
  return hasMoreDays;
}

export default function AvailabilityPortCard({
  portId,
  dateFrom,
  dateTo,
  dateAllowlist = null,
  filters = {},
  canBook = false,
  returnTo = null,
}: AvailabilityPortCardProps) {
  const todayIso = todayIsoLocal();
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const allowSet = useMemo(
    () => (dateAllowlist?.length ? new Set(dateAllowlist) : null),
    [dateAllowlist],
  );

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

  const displayData = useMemo((): AvailabilityReport | null => {
    if (!data) return null;
    if (!allowSet) return data;
    const rows = data.rows.filter((row) => allowSet.has(row.date));
    return { ...data, rows };
  }, [data, allowSet]);

  const displayTotal = allowSet ? allowSet.size : totalDays;
  const stillLoadingAllowlist =
    Boolean(allowSet) && hasMore && (loadingMore || isLoading);
  const displayHasMore = allowSet ? stillLoadingAllowlist : hasMore;

  const hidden = useMemo(() => {
    if (!displayData) return false;
    if (stillLoadingAllowlist) return false;
    return !shouldShowPort(displayData, todayIso, false);
  }, [displayData, todayIso, stillLoadingAllowlist]);

  if (isLoading && !data) {
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
    (displayData.rows.length === 0 && !stillLoadingAllowlist)
  ) {
    return null;
  }

  return (
    <AvailabilityChartSection
      data={displayData}
      titlePrefix="Disponibilidad"
      scrollRootRef={scrollRootRef}
      canBook={canBook}
      returnTo={returnTo}
      footer={
        <InfiniteScrollFooter
          hasMore={displayHasMore}
          loading={loadingMore || stillLoadingAllowlist}
          onLoadMore={loadMore}
          loadedCount={displayData.rows.length}
          totalCount={displayTotal}
          itemLabel="días"
          scrollRootRef={scrollRootRef}
          rootMargin="80px 0px"
          className="mt-0 sm:mt-0"
        />
      }
    />
  );
}
