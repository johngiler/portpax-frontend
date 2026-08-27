"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { fetchAllBookings } from "@/services/bookings/bookingService";
import { fetchPositions } from "@/services/catalogs/positionService";
import type { BookingListItem } from "@/types/booking";
import type { Position } from "@/types/catalog";
import type { CalendarViewModeQuery } from "@/lib/viewFilterQuery";
import {
  seasonBounds,
  type CalendarSeason,
} from "@/views/CalendarView/OperationalSection/calendarOpsUtils";

export type CalendarBookingsParams = {
  mode: CalendarViewModeQuery;
  /** Empty = all accessible ports. */
  portIds: number[];
  from: string;
  to: string;
  year: number;
  season?: CalendarSeason;
  search: string;
};

function calendarParamsKey(p: CalendarBookingsParams): string {
  return [
    p.mode,
    p.portIds.join(","),
    p.search.trim(),
    p.from,
    p.to,
    p.year,
    p.season ?? "natural",
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
  // Soft-focus filters (status, vessel, line, conflict, position) stay on the
  // client so neighbors remain visible in the grids.
  const common = {
    ports: params.portIds.length > 0 ? params.portIds : undefined,
    search: params.search.trim() || undefined,
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
  if (params.portIds.length === 1) {
    const positionsResponse = await fetchPositions({
      port: params.portIds[0],
      pageSize: 100,
    });
    positions = positionsResponse.results.filter((p) => p.is_active);
  } else if (params.portIds.length === 0) {
    const positionsResponse = await fetchPositions({ pageSize: 200 });
    positions = positionsResponse.results.filter((p) => p.is_active);
  } else {
    const responses = await Promise.all(
      params.portIds.map((port) =>
        fetchPositions({ port, pageSize: 100 }),
      ),
    );
    positions = responses.flatMap((res) =>
      res.results.filter((p) => p.is_active),
    );
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
