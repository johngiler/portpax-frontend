"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { parseIsoDate, toIsoDate } from "@/lib/bookingDates";
import {
  fetchAvailabilityReport,
  type AvailabilityReport,
} from "@/services/bookings/bookingService";
import { addDaysIso } from "@/views/CalendarView/OperationalSection/calendarOpsUtils";
import AvailabilityChartSection from "./AvailabilityChartSection";
import BookingsViewSkeleton from "./BookingsViewSkeleton";

const DAYS_BATCH = 30;

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

function minIso(a: string, b: string): string {
  return a <= b ? a : b;
}

function daysInclusive(from: string, to: string): number {
  if (from > to) return 0;
  const a = parseIsoDate(from);
  const b = parseIsoDate(to);
  const t0 = Date.UTC(a.year, a.monthIndex, a.day);
  const t1 = Date.UTC(b.year, b.monthIndex, b.day);
  return Math.floor((t1 - t0) / 86_400_000) + 1;
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
  // Fully booked in this window but more days ahead may open — keep if paging.
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
  const totalDays = useMemo(
    () => daysInclusive(dateFrom, dateTo),
    [dateFrom, dateTo],
  );

  const scrollRootRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<AvailabilityReport | null>(null);
  const [loadedUntil, setLoadedUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  const hasMore = Boolean(
    loadedUntil && dateTo && loadedUntil < dateTo && !error,
  );

  const loadRange = useCallback(
    async (from: string, to: string, append: boolean) => {
      const report = await fetchAvailabilityReport({
        port: portId,
        date_from: from,
        date_to: to,
      });
      setData((prev) => {
        if (!append || !prev) return report;
        return {
          ...report,
          date_from: prev.date_from,
          date_to: report.date_to,
          rows: [...prev.rows, ...report.rows],
        };
      });
      setLoadedUntil(to);
      return report;
    },
    [portId],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setHidden(false);
      setData(null);
      setLoadedUntil(null);
      try {
        const chunkTo = minIso(addDaysIso(dateFrom, DAYS_BATCH - 1), dateTo);
        const report = await loadRange(dateFrom, chunkTo, false);
        if (cancelled) return;
        const more = chunkTo < dateTo;
        if (!shouldShowPort(report, todayIso, more)) {
          setHidden(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(err, "No se pudo cargar la disponibilidad."),
          );
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [portId, dateFrom, dateTo, loadRange, todayIso]);

  const loadMore = useCallback(async () => {
    if (!loadedUntil || loadedUntil >= dateTo || loadingMore) return;
    const nextFrom = addDaysIso(loadedUntil, 1);
    if (nextFrom > dateTo) return;
    setLoadingMore(true);
    try {
      const chunkTo = minIso(addDaysIso(nextFrom, DAYS_BATCH - 1), dateTo);
      await loadRange(nextFrom, chunkTo, true);
    } catch (err) {
      setError(
        getApiErrorMessage(err, "No se pudieron cargar más fechas."),
      );
    } finally {
      setLoadingMore(false);
    }
  }, [loadedUntil, dateTo, loadingMore, loadRange]);

  if (hidden) return null;

  if (loading) {
    return (
      <BookingsViewSkeleton variant="availability" availabilityCards={1} />
    );
  }

  if (error && !data) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
        {error}
      </p>
    );
  }

  if (!data || data.columns.length === 0 || data.rows.length === 0) {
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
