"use client";

import { useCallback, useEffect, useState } from "react";
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
  /** Parent disables Continuar while occupancy is loading or a reassign is saving. */
  onLoadingChange?: (loading: boolean) => void;
};

export default function DatesStep({
  portId,
  vesselId,
  selectedDates,
  onChange,
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
    </div>
  );
}
