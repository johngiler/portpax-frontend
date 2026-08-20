"use client";

import useSWR from "swr";
import type { ConflictTypeFilterValue } from "@/lib/bookingConflictLabels";
import { swrKeys } from "@/lib/swr/keys";
import { fetchAllBookings } from "@/services/bookings/bookingService";
import { fetchPositions } from "@/services/catalogs/positionService";
import type { BookingListItem, BookingStatusFilterValue } from "@/types/booking";
import type { Position } from "@/types/catalog";
import type { CalendarViewModeQuery } from "@/lib/viewFilterQuery";
import {
  seasonBounds,
  type CalendarSeason,
} from "@/views/CalendarView/OperationalSection/calendarOpsUtils";

export type CalendarBookingsParams = {
  mode: CalendarViewModeQuery;
  portId: number;
  shippingLineId: number;
  vesselId: number;
  statuses: BookingStatusFilterValue[];
  search: string;
  from: string;
  to: string;
  year: number;
  season?: CalendarSeason;
  has_conflict?: boolean;
  conflict_severity?: "yellow" | "red" | "green";
  conflict_type?: ConflictTypeFilterValue;
};

function calendarParamsKey(p: CalendarBookingsParams): string {
  return [
    p.mode,
    p.portId,
    p.shippingLineId,
    p.vesselId,
    p.statuses.join(","),
    p.search.trim(),
    p.from,
    p.to,
    p.year,
    p.season ?? "natural",
    p.has_conflict === true ? "1" : p.has_conflict === false ? "0" : "",
    p.conflict_severity ?? "",
    p.conflict_type ?? "",
  ].join("|");
}

type CalendarPayload = {
  bookings: BookingListItem[];
  previousYearBookings: BookingListItem[];
  positions: Position[];
};

async function fetchCalendarPayload(
  params: CalendarBookingsParams,
): Promise<CalendarPayload> {
  const common = {
    port: params.portId > 0 ? params.portId : undefined,
    shipping_line: params.shippingLineId > 0 ? params.shippingLineId : undefined,
    vessel: params.vesselId > 0 ? params.vesselId : undefined,
    statuses: params.statuses.length > 0 ? params.statuses : undefined,
    search: params.search.trim() || undefined,
    has_conflict: params.has_conflict,
    conflict_severity: params.conflict_severity,
    conflict_type: params.conflict_type,
    ordering: "call_date" as const,
    pageSize: 500,
  };

  let bookings: BookingListItem[];
  let previousYearBookings: BookingListItem[] = [];

  if (params.mode === "annual") {
    const season = params.season ?? "natural";
    const prev = seasonBounds(params.year - 1, season);
    const [currentRows, prevRows] = await Promise.all([
      fetchAllBookings({
        ...common,
        call_date_from: params.from,
        call_date_to: params.to,
      }),
      fetchAllBookings({
        ...common,
        call_date_from: prev.from,
        call_date_to: prev.to,
      }),
    ]);
    bookings = currentRows;
    previousYearBookings = prevRows;
  } else {
    bookings = await fetchAllBookings({
      ...common,
      call_date_from: params.from,
      call_date_to: params.to,
    });
  }

  let positions: Position[] = [];
  if (params.portId > 0) {
    const positionsResponse = await fetchPositions({
      port: params.portId,
      pageSize: 100,
    });
    positions = positionsResponse.results.filter((p) => p.is_active);
  } else {
    const positionsResponse = await fetchPositions({ pageSize: 200 });
    positions = positionsResponse.results.filter((p) => p.is_active);
  }

  return { bookings, previousYearBookings, positions };
}

export function useCalendarBookings(params: CalendarBookingsParams) {
  const key = calendarParamsKey(params);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    swrKeys.calendarBookings(key),
    () => fetchCalendarPayload(params),
    { keepPreviousData: false },
  );

  return {
    bookings: data?.bookings ?? [],
    previousYearBookings: data?.previousYearBookings ?? [],
    positions: data?.positions ?? [],
    isLoading: Boolean(isLoading || (isValidating && !data)),
    isValidating,
    error,
    mutate,
  };
}
