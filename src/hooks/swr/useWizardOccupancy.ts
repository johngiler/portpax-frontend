"use client";

import useSWR from "swr";
import {
  buildCalendarOccupancy,
  mergeBookingsById,
} from "@/components/booking/BookingDateCalendar/buildCalendarOccupancy";
import type { CalendarDayBooking } from "@/components/booking/BookingDateCalendar/types";
import { swrKeys } from "@/lib/swr/keys";
import { fetchAllBookings } from "@/services/bookings/bookingService";

export type WizardVisibleRange = {
  from: string;
  to: string;
};

type OccupancyPayload = {
  byDate: Record<string, CalendarDayBooking[]>;
  blockedDates: string[];
};

async function fetchWizardOccupancy(
  portId: number,
  vesselId: number,
  from: string,
  to: string,
): Promise<OccupancyPayload> {
  const common = {
    call_date_from: from,
    call_date_to: to,
    ordering: "call_date" as const,
    pageSize: 500,
  };
  const [portBookings, vesselBookings] = await Promise.all([
    fetchAllBookings({ ...common, port: portId }),
    fetchAllBookings({ ...common, vessel: vesselId }),
  ]);
  return buildCalendarOccupancy(
    mergeBookingsById(portBookings, vesselBookings),
    portId,
    vesselId,
  );
}

export function useWizardOccupancy(
  portId: number | null,
  vesselId: number | null,
  range: WizardVisibleRange | null,
) {
  const enabled = Boolean(
    portId &&
      portId > 0 &&
      vesselId &&
      vesselId > 0 &&
      range?.from &&
      range?.to,
  );

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    enabled
      ? swrKeys.wizardOccupancy(portId!, vesselId!, range!.from, range!.to)
      : null,
    () => fetchWizardOccupancy(portId!, vesselId!, range!.from, range!.to),
    { keepPreviousData: false },
  );

  return {
    occupancyByDate: data?.byDate ?? {},
    blockedDates: data?.blockedDates ?? [],
    isLoading: Boolean(enabled && (isLoading || (isValidating && !data))),
    isValidating,
    error,
    mutate,
  };
}
