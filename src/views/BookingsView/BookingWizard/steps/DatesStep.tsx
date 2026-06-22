"use client";

import { useEffect, useState } from "react";
import BookingDateCalendar from "@/components/booking/BookingDateCalendar";
import { fetchBookings } from "@/services/bookings/bookingService";

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
  const [occupiedDates, setOccupiedDates] = useState<string[]>([]);
  const [loadingOccupied, setLoadingOccupied] = useState(false);

  useEffect(() => {
    if (!portId || !vesselId) {
      setOccupiedDates([]);
      return;
    }

    let cancelled = false;
    setLoadingOccupied(true);

    fetchBookings({ port: portId, vessel: vesselId, pageSize: 500 })
      .then((data) => {
        if (!cancelled) {
          setOccupiedDates(data.results.map((booking) => booking.call_date));
        }
      })
      .catch(() => {
        if (!cancelled) setOccupiedDates([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingOccupied(false);
      });

    return () => {
      cancelled = true;
    };
  }, [portId, vesselId]);

  return (
    <div className="max-w-2xl">
      <BookingDateCalendar
        selectedDates={selectedDates}
        onChange={onChange}
        occupiedDates={occupiedDates}
        loadingOccupied={loadingOccupied}
      />
    </div>
  );
}
