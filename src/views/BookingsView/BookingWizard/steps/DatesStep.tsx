"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import BookingDateCalendar, {
  type BookingDateCalendarVisibleRange,
} from "@/components/booking/BookingDateCalendar";
import {
  useWizardOccupancy,
  type WizardVisibleRange,
} from "@/hooks/swr/useWizardOccupancy";
import { suggestBookingPositions } from "@/services/bookings/bookingService";
import type { Booking, PositionSuggestion } from "@/types/booking";

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
  preferredPositionId: number | null;
  preferredPositionLabel: string;
  onPreferredPositionChange: (id: number | null, label: string) => void;
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
  preferredPositionId,
  preferredPositionLabel,
  onPreferredPositionChange,
  onLoadingChange,
}: DatesStepProps) {
  const [visibleRange, setVisibleRange] = useState<WizardVisibleRange | null>(
    null,
  );
  const [savingIds, setSavingIds] = useState<Set<number>>(() => new Set());
  const [suggestions, setSuggestions] = useState<PositionSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

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

  useEffect(() => {
    if (!portId || !vesselId || selectedDates.length === 0) {
      setSuggestions([]);
      return;
    }
    const callDate = selectedDates[0];
    let cancelled = false;
    setLoadingSuggestions(true);
    suggestBookingPositions({
      port: portId,
      vessel: vesselId,
      call_date: callDate,
    })
      .then((data) => {
        if (cancelled) return;
        setSuggestions(data.positions);
        if (preferredPositionId == null) {
          const recommended =
            data.positions.find((p) => p.recommended) ?? data.positions[0];
          if (recommended) {
            onPreferredPositionChange(recommended.id, recommended.code);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSuggestions(false);
      });
    return () => {
      cancelled = true;
    };
    // Seed once per port/vessel/dates; ignore preferred updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [portId, vesselId, selectedDates]);

  const handleOccupancyReassigned = useCallback(
    async (updated: Booking) => {
      await applyReassignedBooking(updated);
    },
    [applyReassignedBooking],
  );

  const positionOptions = suggestions.map((position) => {
    const tags: string[] = [];
    if (position.recommended) tags.push("sugerida");
    if (position.occupied) tags.push("ocupada");
    const suffix = tags.length > 0 ? ` (${tags.join(", ")})` : "";
    return {
      value: position.id,
      label: `${position.code}${suffix}`,
    };
  });

  if (
    preferredPositionId != null &&
    preferredPositionLabel &&
    !positionOptions.some((o) => o.value === preferredPositionId)
  ) {
    positionOptions.unshift({
      value: preferredPositionId,
      label: preferredPositionLabel,
    });
  }

  function handlePreferredChange(nextId: number) {
    if (nextId <= 0) {
      onPreferredPositionChange(null, "");
      return;
    }
    const match = suggestions.find((p) => p.id === nextId);
    onPreferredPositionChange(
      nextId,
      match?.code ?? (preferredPositionLabel || String(nextId)),
    );
  }

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
          Se aplican a todas las fechas del lote. Puedes dejarlos vacíos y
          completarlos después.
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

      {selectedDates.length > 0 ? (
        <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="mb-1 flex items-center gap-2">
            <LayoutGrid
              className="h-4 w-4 text-[var(--admin-accent)]"
              strokeWidth={2}
            />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Posición sugerida
            </h3>
          </div>
          <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
            El sistema propone una posición (LOA, calado y disponibilidad) según
            las fechas y el barco. Puedes cambiarla; es solo una sugerencia para
            el lote.
          </p>
          <FormFieldSelect<number>
            label="Posición para el lote"
            name="wizard_preferred_position"
            value={preferredPositionId ?? 0}
            onChange={handlePreferredChange}
            options={positionOptions}
            optionLabel={
              loadingSuggestions
                ? "Cargando sugerencias…"
                : "Auto (sin preferencia)"
            }
            emptyValue={0}
            compact
            disabled={loadingSuggestions}
          />
        </div>
      ) : null}
    </div>
  );
}
