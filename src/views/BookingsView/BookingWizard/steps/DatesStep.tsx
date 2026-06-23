"use client";

import { useEffect, useState } from "react";
import { fetchAllBookings } from "@/services/bookings/bookingService";
import BookingDateCalendar from "@/components/booking/BookingDateCalendar";
import {
  buildCalendarOccupancy,
  mergeBookingsById,
} from "@/components/booking/BookingDateCalendar/buildCalendarOccupancy";
import type { CalendarDayBooking } from "@/components/booking/BookingDateCalendar/types";

type DatesStepProps = {
  portId: number | null;
  vesselId: number | null;
  selectedDates: string[];
  onChange: (dates: string[]) => void;
};

export default function DatesStep({
  portId,
  vesselId,
  selectedDates,
  onChange,
}: DatesStepProps) {
  const [occupancyByDate, setOccupancyByDate] = useState<Record<string, CalendarDayBooking[]>>(
    {},
  );
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loadingOccupied, setLoadingOccupied] = useState(false);

  useEffect(() => {
    if (!portId || !vesselId) {
      setOccupancyByDate({});
      setBlockedDates([]);
      return;
    }

    let cancelled = false;
    setLoadingOccupied(true);

    Promise.all([fetchAllBookings({ port: portId }), fetchAllBookings({ vessel: vesselId })])
      .then(([portBookings, vesselBookings]) => {
        if (cancelled) return;
        const { byDate, blockedDates: blocked } = buildCalendarOccupancy(
          mergeBookingsById(portBookings, vesselBookings),
          portId,
          vesselId,
        );
        setOccupancyByDate(byDate);
        setBlockedDates(blocked);
      })
      .catch(() => {
        if (!cancelled) {
          setOccupancyByDate({});
          setBlockedDates([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingOccupied(false);
      });

    return () => {
      cancelled = true;
    };
  }, [portId, vesselId]);

  return (
    <BookingDateCalendar
      selectedDates={selectedDates}
      onChange={onChange}
      occupancyByDate={occupancyByDate}
      blockedDates={blockedDates}
      loadingOccupied={loadingOccupied}
    />
  );
}
