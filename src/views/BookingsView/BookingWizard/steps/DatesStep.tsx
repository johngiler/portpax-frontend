"use client";

import { useCallback, useEffect, useState } from "react";
import { FormField } from "@/components/ui/FormField";
import BookingDateCalendar, {
  type BookingDateCalendarVisibleRange,
} from "@/components/booking/BookingDateCalendar";
import {
  useWizardOccupancy,
  type WizardVisibleRange,
} from "@/hooks/swr/useWizardOccupancy";
import type { Booking } from "@/types/booking";

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
  /** Parent disables Continuar while occupancy is loading or a reassign is saving. */
  onLoadingChange?: (loading: boolean) => void;
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
  onLoadingChange,
}: DatesStepProps) {
  const [visibleRange, setVisibleRange] = useState<WizardVisibleRange | null>(
    null,
  );
  const [savingIds, setSavingIds] = useState<Set<number>>(() => new Set());

  const handleVisibleRangeChange = useCallback(
    (range: BookingDateCalendarVisibleRange) => {
      setVisibleRange((prev) =>
        prev?.from === range.from && prev?.to === range.to ? prev : range,
      );
    },
    [],
  );

  const handleReassignSavingChange = useCallback(
    (bookingId: number, saving: boolean) => {
      setSavingIds((prev) => {
        const has = prev.has(bookingId);
        if (saving && has) return prev;
        if (!saving && !has) return prev;
        const next = new Set(prev);
        if (saving) next.add(bookingId);
        else next.delete(bookingId);
        return next;
      });
    },
    [],
  );

  const {
    occupancyByDate,
    blockedDates,
    isLoading: loadingOccupied,
    applyReassignedBooking,
  } = useWizardOccupancy(portId, vesselId, visibleRange);

  const busy = loadingOccupied || savingIds.size > 0;

  useEffect(() => {
    onLoadingChange?.(busy);
    return () => {
      onLoadingChange?.(false);
    };
  }, [busy, onLoadingChange]);

  const handleOccupancyReassigned = useCallback(
    async (updated: Booking) => {
      await applyReassignedBooking(updated);
    },
    [applyReassignedBooking],
  );

  return (
    <div className="space-y-6">
      <BookingDateCalendar
        selectedDates={selectedDates}
        onChange={onChange}
        occupancyByDate={occupancyByDate}
        blockedDates={blockedDates}
        loadingOccupied={loadingOccupied}
        canReassignOccupancy
        onOccupancyReassigned={handleOccupancyReassigned}
        onReassignSavingChange={handleReassignSavingChange}
        onVisibleRangeChange={handleVisibleRangeChange}
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
