"use client";

import { useMemo, useRef } from "react";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import { useAvailabilityInfinite } from "@/hooks/swr/useAvailabilityInfinite";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { toIsoDate } from "@/lib/bookingDates";
import type { AvailabilityReport } from "@/services/bookings/bookingService";
import AvailabilityChartSection from "./AvailabilityChartSection";
import BookingsViewSkeleton from "./BookingsViewSkeleton";

type AvailabilityPortCardProps = {
  portId: number;
  dateFrom: string;
  dateTo: string;
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
  canBook = false,
  returnTo = null,
}: AvailabilityPortCardProps) {
  const todayIso = todayIsoLocal();
  const scrollRootRef = useRef<HTMLDivElement>(null);

  const { data, totalDays, hasMore, isLoading, loadingMore, error, loadMore } =
    useAvailabilityInfinite(portId, dateFrom, dateTo, true);

  const hidden = useMemo(() => {
    if (!data) return false;
    return !shouldShowPort(data, todayIso, hasMore);
  }, [data, todayIso, hasMore]);

  if (isLoading) {
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

  if (hidden || !data || data.columns.length === 0 || data.rows.length === 0) {
    return null;
  }

  return (
    <AvailabilityChartSection
      data={data}
      titlePrefix="Disponibilidad"
      scrollRootRef={scrollRootRef}
      canBook={canBook}
      returnTo={returnTo}
      footer={
        <InfiniteScrollFooter
          hasMore={hasMore}
          loading={loadingMore}
          onLoadMore={loadMore}
          loadedCount={data.rows.length}
          totalCount={totalDays}
          itemLabel="días"
          scrollRootRef={scrollRootRef}
          rootMargin="80px 0px"
          className="mt-0 sm:mt-0"
        />
      }
    />
  );
}
