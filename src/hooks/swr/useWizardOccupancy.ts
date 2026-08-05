"use client";

import { useCallback } from "react";
import useSWR from "swr";
import {
  applyBookingPositionToOccupancy,
  buildCalendarOccupancy,
  mergeBookingsById,
} from "@/components/booking/BookingDateCalendar/buildCalendarOccupancy";
import type { CalendarDayBooking } from "@/components/booking/BookingDateCalendar/types";
import { swrKeys } from "@/lib/swr/keys";
import { fetchAllBookings } from "@/services/bookings/bookingService";
import type { Booking } from "@/types/booking";

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

  const applyReassignedBooking = useCallback(
    async (updated: Booking) => {
      await mutate(
        (current) => {
          if (!current) return current;
          return {
            ...current,
            byDate: applyBookingPositionToOccupancy(
              current.byDate,
              updated.id,
              updated.position,
              updated.position_code,
              updated.eta,
              updated.etd,
            ),
          };
        },
        { revalidate: true },
      );
    },
    [mutate],
  );

  return {
    occupancyByDate: data?.byDate ?? {},
    blockedDates: data?.blockedDates ?? [],
    // Only block UI on first load for this range — not on revalidate after reassign.
    isLoading: Boolean(enabled && isLoading && !data),
    isValidating,
    error,
    mutate,
    applyReassignedBooking,
  };
}
