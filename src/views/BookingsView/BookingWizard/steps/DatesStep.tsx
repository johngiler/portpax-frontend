"use client";

import { useEffect, useState } from "react";
import { FormField } from "@/components/ui/FormField";
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
  eta: string;
  etd: string;
  plannedPax: string;
  onEtaChange: (value: string) => void;
  onEtdChange: (value: string) => void;
  onPlannedPaxChange: (value: string) => void;
};

export default function DatesStep({
  portId,
  vesselId,
  selectedDates,
  onChange,
  eta,
  etd,
  plannedPax,
  onEtaChange,
  onEtdChange,
  onPlannedPaxChange,
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
    <div className="space-y-6">
      <BookingDateCalendar
        selectedDates={selectedDates}
        onChange={onChange}
        occupancyByDate={occupancyByDate}
        blockedDates={blockedDates}
        loadingOccupied={loadingOccupied}
      />

      <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Horarios y PAX (opcional)
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Se aplican a todas las fechas del lote. Puedes dejarlos vacíos y completarlos
          después.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <FormField
            label="ETA"
            name="wizard_eta"
            type="text"
            value={eta}
            onChange={(v) => onEtaChange(String(v))}
            placeholder="08:00"
          />
          <FormField
            label="ETD"
            name="wizard_etd"
            type="text"
            value={etd}
            onChange={(v) => onEtdChange(String(v))}
            placeholder="18:00"
          />
          <FormField
            label="PAX proyectado"
            name="wizard_planned_pax"
            type="number"
            min={0}
            value={plannedPax}
            onChange={(v) => onPlannedPaxChange(String(v))}
          />
        </div>
      </div>
    </div>
  );
}
