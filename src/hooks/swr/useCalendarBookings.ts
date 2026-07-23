"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { fetchAllBookings } from "@/services/bookings/bookingService";
import { fetchPositions } from "@/services/catalogs/positionService";
import type { Booking, BookingListStatusFilter } from "@/types/booking";
import type { Position } from "@/types/catalog";
import type { CalendarViewModeQuery } from "@/lib/viewFilterQuery";
import { yearBounds } from "@/views/CalendarView/OperationalSection/calendarOpsUtils";

export type CalendarBookingsParams = {
  mode: CalendarViewModeQuery;
  portId: number;
  shippingLineId: number;
  vesselId: number;
  status: BookingListStatusFilter;
  search: string;
  from: string;
  to: string;
  year: number;
};

function calendarParamsKey(p: CalendarBookingsParams): string {
  return [
    p.mode,
    p.portId,
    p.shippingLineId,
    p.vesselId,
    p.status,
    p.search.trim(),
    p.from,
    p.to,
    p.year,
  ].join("|");
}

type CalendarPayload = {
  bookings: Booking[];
  previousYearBookings: Booking[];
  positions: Position[];
};

async function fetchCalendarPayload(
  params: CalendarBookingsParams,
): Promise<CalendarPayload> {
  const common = {
    port: params.portId > 0 ? params.portId : undefined,
    shipping_line: params.shippingLineId > 0 ? params.shippingLineId : undefined,
    vessel: params.vesselId > 0 ? params.vesselId : undefined,
    status: params.status || undefined,
    search: params.search.trim() || undefined,
    ordering: "call_date" as const,
    pageSize: 500,
  };

  let bookings: Booking[];
  let previousYearBookings: Booking[] = [];

  if (params.mode === "annual") {
    const prev = yearBounds(params.year - 1);
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
  }

  return { bookings, previousYearBookings, positions };
}

export function useCalendarBookings(params: CalendarBookingsParams) {
  const key = calendarParamsKey(params);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    swrKeys.calendarBookings(key),
    () => fetchCalendarPayload(params),
  );

  return {
    bookings: data?.bookings ?? [],
    previousYearBookings: data?.previousYearBookings ?? [],
    positions: data?.positions ?? [],
    isLoading: isLoading && !data,
    isValidating,
    error,
    mutate,
  };
}
