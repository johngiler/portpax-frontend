"use client";

import { useCallback, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import type { ConflictTypeFilterValue } from "@/lib/bookingConflictLabels";
import { swrKeys } from "@/lib/swr/keys";
import {
  fetchVesselProximityMatrix,
  type VesselProximityMatrixCell,
  type VesselProximityMatrixPort,
  type VesselProximityMatrixResponse,
} from "@/services/bookings/vesselProximityMatrixService";
import type { BookingStatusFilterValue } from "@/types/booking";
import { serializeBookingStatusFilters } from "@/types/booking";

export const PROXIMITY_DAYS_BATCH = 30;

export type VesselProximityListFilters = {
  port?: number;
  statuses?: BookingStatusFilterValue[];
  has_conflict?: boolean;
  conflict_severity?: "yellow" | "red" | "green";
  conflict_type?: ConflictTypeFilterValue;
  call_dates?: string[];
};

function filtersKey(filters: VesselProximityListFilters): string {
  return [
    filters.port ?? 0,
    filters.statuses?.length
      ? serializeBookingStatusFilters(filters.statuses)
      : "",
    filters.has_conflict === true
      ? "1"
      : filters.has_conflict === false
        ? "0"
        : "",
    filters.conflict_severity ?? "",
    filters.conflict_type ?? "",
    (filters.call_dates ?? []).join(","),
  ].join("|");
}

function mergeProximityPages(
  pages: VesselProximityMatrixResponse[],
  dateFrom: string,
  dateTo: string,
): VesselProximityMatrixResponse | null {
  if (!pages.length) return null;
  const first = pages[0];
  const last = pages[pages.length - 1];
  const portMap = new Map<number, VesselProximityMatrixPort>();
  const cellMap = new Map<number, VesselProximityMatrixCell>();
  const datesSet = new Set<string>();

  for (const page of pages) {
    for (const port of page.ports) portMap.set(port.id, port);
    for (const cell of page.cells) {
      cellMap.set(cell.booking_id, cell);
      datesSet.add(cell.date);
    }
  }

  const cells = [...cellMap.values()].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.port_id - b.port_id ||
      a.booking_id - b.booking_id,
  );

  return {
    ...first,
    date_from: dateFrom,
    date_to: dateTo,
    dates: [...datesSet].sort(),
    ports: [...portMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    cells,
    matched_days: last.matched_days ?? first.matched_days ?? datesSet.size,
    page: last.page ?? first.page,
    page_size: last.page_size ?? first.page_size ?? PROXIMITY_DAYS_BATCH,
    has_more: last.has_more ?? false,
  };
}

export function useVesselProximityInfinite(
  vesselId: number,
  dateFrom: string | undefined,
  dateTo: string | undefined,
  enabled = true,
  filters: VesselProximityListFilters = {},
) {
  const keyExtra = filtersKey(filters);
  const portId = filters.port;
  const statuses = filters.statuses;
  const hasConflict = filters.has_conflict;
  const conflictSeverity = filters.conflict_severity;
  const conflictType = filters.conflict_type;
  const callDates = filters.call_dates;

  const getKey = useCallback(
    (pageIndex: number, previousPageData: VesselProximityMatrixResponse | null) => {
      if (!enabled || vesselId <= 0 || !dateFrom || !dateTo) return null;
      if (previousPageData && previousPageData.has_more === false) return null;
      return [
        ...swrKeys.vesselProximityInfinite(vesselId, dateFrom, dateTo, keyExtra),
        "paged",
        pageIndex + 1,
      ] as const;
    },
    [enabled, vesselId, dateFrom, dateTo, keyExtra],
  );

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(getKey, (key) => {
      const page = key[key.length - 1] as number;
      return fetchVesselProximityMatrix({
        vessel: vesselId,
        call_date_from: dateFrom!,
        call_date_to: dateTo!,
        port: portId && portId > 0 ? portId : undefined,
        statuses: statuses && statuses.length > 0 ? statuses : undefined,
        has_conflict: hasConflict,
        conflict_severity: conflictSeverity,
        conflict_type: conflictType,
        call_dates: callDates && callDates.length > 0 ? callDates : undefined,
        page,
        page_size: PROXIMITY_DAYS_BATCH,
      });
    });

  const merged = useMemo(
    () =>
      data?.length && dateFrom && dateTo
        ? mergeProximityPages(data, dateFrom, dateTo)
        : null,
    [data, dateFrom, dateTo],
  );

  const matchedDays = merged?.matched_days ?? 0;
  const loadedDays = merged?.dates.length ?? 0;
  const hasMore = Boolean(merged?.has_more);
  const loadingMore = isValidating && size > 1 && hasMore;

  const loadMore = useCallback(() => {
    if (!enabled || loadingMore || !hasMore || isLoading) return;
    void setSize(size + 1);
  }, [enabled, loadingMore, hasMore, isLoading, setSize, size]);

  return {
    data: merged,
    matchedDays,
    loadedDays,
    hasMore,
    isLoading: Boolean(enabled) && isLoading && !merged,
    isValidating,
    loadingMore,
    error,
    loadMore,
    mutate,
  };
}
