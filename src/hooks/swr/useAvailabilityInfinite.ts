"use client";

import { useCallback, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import { parseIsoDate } from "@/lib/bookingDates";
import type { ConflictTypeFilterValue } from "@/lib/bookingConflictLabels";
import { swrKeys } from "@/lib/swr/keys";
import {
  fetchAvailabilityReport,
  type AvailabilityReport,
} from "@/services/bookings/bookingService";
import { addDaysIso } from "@/views/CalendarView/OperationalSection/calendarOpsUtils";

export const AVAILABILITY_DAYS_BATCH = 30;

export type AvailabilityListFilters = {
  shipping_line?: number;
  vessel?: number;
  position?: number;
  statuses?: string[];
  has_conflict?: boolean;
  conflict_severity?: "yellow" | "red" | "green";
  conflict_type?: ConflictTypeFilterValue;
  /** Exact ships per day (1–4); server filters + pages matching days. */
  ships_per_day?: number;
};

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

function pageDateRange(
  dateFrom: string,
  dateTo: string,
  pageIndex: number,
): { from: string; to: string } | null {
  const from = addDaysIso(dateFrom, pageIndex * AVAILABILITY_DAYS_BATCH);
  if (from > dateTo) return null;
  const to = minIso(addDaysIso(from, AVAILABILITY_DAYS_BATCH - 1), dateTo);
  return { from, to };
}

function filtersKey(filters: AvailabilityListFilters): string {
  return [
    filters.shipping_line ?? 0,
    filters.vessel ?? 0,
    filters.position ?? 0,
    (filters.statuses ?? []).join(","),
    filters.has_conflict === true
      ? "1"
      : filters.has_conflict === false
        ? "0"
        : "",
    filters.conflict_severity ?? "",
    filters.conflict_type ?? "",
    filters.ships_per_day ?? 0,
  ].join("|");
}

export function useAvailabilityInfinite(
  portId: number,
  dateFrom: string,
  dateTo: string,
  enabled = true,
  filters: AvailabilityListFilters = {},
) {
  const keyExtra = filtersKey(filters);
  const line = filters.shipping_line;
  const vessel = filters.vessel;
  const position = filters.position;
  const statuses = filters.statuses;
  const hasConflict = filters.has_conflict;
  const conflictSeverity = filters.conflict_severity;
  const conflictType = filters.conflict_type;
  const shipsPerDay =
    filters.ships_per_day != null && filters.ships_per_day >= 1
      ? filters.ships_per_day
      : 0;
  const densityMode = shipsPerDay > 0;
  /** Paginate matching occupied days (conflict filter) instead of empty date windows. */
  const occupiedDaysMode =
    densityMode ||
    hasConflict !== undefined ||
    Boolean(conflictSeverity) ||
    Boolean(conflictType);

  const getKey = useCallback(
    (pageIndex: number, previousPageData: AvailabilityReport | null) => {
      if (!enabled || portId <= 0 || !dateFrom || !dateTo) return null;
      if (occupiedDaysMode) {
        if (previousPageData && previousPageData.has_more === false) return null;
        return [
          ...swrKeys.availabilityInfinite(portId, dateFrom, dateTo, keyExtra),
          "occupied",
          pageIndex + 1,
        ] as const;
      }
      if (previousPageData && previousPageData.date_to >= dateTo) return null;
      const range = pageDateRange(dateFrom, dateTo, pageIndex);
      if (!range) return null;
      return [
        ...swrKeys.availabilityInfinite(portId, dateFrom, dateTo, keyExtra),
        pageIndex,
        range.from,
        range.to,
      ] as const;
    },
    [enabled, portId, dateFrom, dateTo, keyExtra, occupiedDaysMode],
  );

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(getKey, (key) => {
      if (occupiedDaysMode) {
        const page = key[key.length - 1] as number;
        return fetchAvailabilityReport({
          port: portId,
          date_from: dateFrom,
          date_to: dateTo,
          shipping_line: line,
          vessel,
          position,
          statuses,
          has_conflict: hasConflict,
          conflict_severity: conflictSeverity,
          conflict_type: conflictType,
          ships_per_day: densityMode ? shipsPerDay : undefined,
          page,
          page_size: AVAILABILITY_DAYS_BATCH,
        });
      }
      const from = key[key.length - 2] as string;
      const to = key[key.length - 1] as string;
      return fetchAvailabilityReport({
        port: portId,
        date_from: from,
        date_to: to,
        shipping_line: line,
        vessel,
        position,
        statuses,
        has_conflict: hasConflict,
        conflict_severity: conflictSeverity,
        conflict_type: conflictType,
      });
    });

  const merged = useMemo((): AvailabilityReport | null => {
    if (!data?.length) return null;
    const first = data[0];
    const last = data[data.length - 1];
    if (occupiedDaysMode) {
      return {
        ...first,
        date_from: dateFrom,
        date_to: dateTo,
        rows: data.flatMap((page) => page.rows),
        matched_days: last.matched_days ?? first.matched_days,
        has_more: last.has_more ?? false,
        page: last.page,
        page_size: last.page_size ?? AVAILABILITY_DAYS_BATCH,
        ships_per_day: densityMode ? shipsPerDay : first.ships_per_day,
      };
    }
    return {
      ...first,
      date_from: first.date_from,
      date_to: last.date_to,
      rows: data.flatMap((page) => page.rows),
    };
  }, [data, occupiedDaysMode, densityMode, dateFrom, dateTo, shipsPerDay]);

  const loadedUntil = merged?.date_to ?? null;
  const hasMore = occupiedDaysMode
    ? Boolean(merged?.has_more)
    : Boolean(loadedUntil && loadedUntil < dateTo);
  const totalDays = useMemo(() => {
    if (occupiedDaysMode && merged?.matched_days != null) {
      return merged.matched_days;
    }
    return daysInclusive(dateFrom, dateTo);
  }, [occupiedDaysMode, merged?.matched_days, dateFrom, dateTo]);
  const loadingMore = isValidating && size > 1 && hasMore;

  const loadMore = useCallback(() => {
    if (!enabled || loadingMore || !hasMore || isLoading) return;
    void setSize(size + 1);
  }, [enabled, loadingMore, hasMore, isLoading, setSize, size]);

  return {
    data: merged,
    totalDays,
    hasMore,
    isLoading: Boolean(enabled) && isLoading && !merged,
    isValidating,
    loadingMore,
    error,
    loadMore,
    mutate,
  };
}
