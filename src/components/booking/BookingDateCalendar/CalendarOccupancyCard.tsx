"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Anchor,
  Clock3,
  LayoutGrid,
  MapPin,
  Ship,
} from "lucide-react";
import BookingCodeRef from "@/components/booking/BookingCodeRef";
import PositionOccupancyHint from "@/components/booking/PositionOccupancyHint";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import {
  formatTimeShort,
  toTimeInputValue,
} from "@/lib/bookingDisplay";
import { positionOccupancyHint } from "@/lib/positionOccupancyHint";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import {
  suggestBookingPositions,
  updateBooking,
} from "@/services/bookings/bookingService";
import { bookingDetailHref, type Booking, type PositionSuggestion } from "@/types/booking";
import type { CalendarDayBooking } from "./types";

type CalendarOccupancyCardProps = {
  booking: CalendarDayBooking;
  /** Allow changing position / ETA / ETD of an existing booking at the current port. */
  canReassign?: boolean;
  onReassigned?: (updated: Booking) => void;
  /** Reports save-in-progress for this booking (blocks wizard Continuar). */
  onSavingChange?: (bookingId: number, saving: boolean) => void;
};

function cardTone(booking: CalendarDayBooking): string {
  if (booking.blocksSelection) {
    return "border-amber-300/90 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 shadow-amber-100/50 dark:border-amber-800/70 dark:from-amber-950/40 dark:via-zinc-900 dark:to-amber-950/20";
  }
  if (!booking.isCurrentPort) {
    return "border-violet-200/90 bg-gradient-to-br from-violet-50/80 via-white to-violet-50/30 shadow-violet-100/40 dark:border-violet-900/60 dark:from-violet-950/30 dark:via-zinc-900 dark:to-violet-950/15";
  }
  return "border-zinc-200/90 bg-gradient-to-br from-white via-zinc-50/50 to-[var(--admin-accent)]/[0.04] shadow-zinc-100/60 dark:border-zinc-700 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950";
}

function statusBadgeClass(booking: CalendarDayBooking): string {
  if (booking.blocksSelection) {
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200";
  }
  if (!booking.isCurrentPort) {
    return "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200";
  }
  return "bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]";
}

export default function CalendarOccupancyCard({
  booking,
  canReassign = false,
  onReassigned,
  onSavingChange,
}: CalendarOccupancyCardProps) {
  const reassignable =
    canReassign &&
    booking.isCurrentPort &&
    !booking.blocksSelection &&
    booking.status !== "c";

  const [positionId, setPositionId] = useState(booking.position_id ?? 0);
  const [eta, setEta] = useState(toTimeInputValue(booking.eta));
  const [etd, setEtd] = useState(toTimeInputValue(booking.etd));
  const [suggestions, setSuggestions] = useState<PositionSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setPositionId(booking.position_id ?? 0);
    setEta(toTimeInputValue(booking.eta));
    setEtd(toTimeInputValue(booking.etd));
  }, [booking.position_id, booking.eta, booking.etd, booking.id]);

  useEffect(() => {
    onSavingChange?.(booking.id, saving);
    return () => {
      onSavingChange?.(booking.id, false);
    };
  }, [saving, booking.id, onSavingChange]);

  const loadSuggestions = useCallback(async () => {
    if (!reassignable) return;
    setLoadingSuggestions(true);
    try {
      const data = await suggestBookingPositions({
        port: booking.port_id,
        vessel: booking.vessel_id,
        call_date: booking.call_date,
        exclude_booking: booking.id,
      });
      setSuggestions(data.positions);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [reassignable, booking.port_id, booking.vessel_id, booking.call_date]);

  useEffect(() => {
    void loadSuggestions();
  }, [loadSuggestions]);

  async function handlePositionChange(nextId: number) {
    const previousId = booking.position_id ?? 0;
    setPositionId(nextId);
    if (nextId === previousId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateBooking(booking.id, {
        position: nextId > 0 ? nextId : null,
      });
      setPositionId(updated.position ?? 0);
      await onReassigned?.(updated);
      void loadSuggestions();
    } catch (err) {
      setPositionId(previousId);
      setSaveError(
        getApiErrorMessage(err, "No se pudo reasignar la posición."),
      );
    } finally {
      setSaving(false);
    }
  }

  async function commitTimes() {
    const nextEta = toTimeInputValue(eta) || null;
    const nextEtd = toTimeInputValue(etd) || null;
    const prevEta = toTimeInputValue(booking.eta) || null;
    const prevEtd = toTimeInputValue(booking.etd) || null;
    if (nextEta === prevEta && nextEtd === prevEtd) return;

    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateBooking(booking.id, {
        eta: nextEta,
        etd: nextEtd,
      });
      setEta(toTimeInputValue(updated.eta));
      setEtd(toTimeInputValue(updated.etd));
      await onReassigned?.(updated);
    } catch (err) {
      setEta(toTimeInputValue(booking.eta));
      setEtd(toTimeInputValue(booking.etd));
      setSaveError(
        getApiErrorMessage(err, "No se pudieron guardar ETA / ETD."),
      );
    } finally {
      setSaving(false);
    }
  }

  const positionOptions = useMemo(() => {
    const opts = suggestions.map((position) => {
      const tags: string[] = [];
      if (position.recommended) tags.push("recomendada");
      if (position.occupied) tags.push("ocupada");
      const suffix = tags.length > 0 ? ` (${tags.join(", ")})` : "";
      return {
        value: position.id,
        label: `${position.code}${suffix}`,
      };
    });
    const currentId = booking.position_id;
    if (
      currentId &&
      currentId > 0 &&
      !opts.some((opt) => opt.value === currentId)
    ) {
      opts.unshift({
        value: currentId,
        label: booking.position_code ?? `Posición ${currentId}`,
      });
    }
    return opts;
  }, [suggestions, booking.position_id, booking.position_code]);

  const etaEtdLabel = `${formatTimeShort(booking.eta)}–${formatTimeShort(booking.etd)}`;
  const detailHref = bookingDetailHref(booking);
  const selectedSuggestion = suggestions.find((p) => p.id === positionId);
  const occupancyHint = positionOccupancyHint(selectedSuggestion);

  return (
    <article
      className={[
        "overflow-hidden rounded-2xl border shadow-[var(--admin-card-shadow)]",
        cardTone(booking),
      ].join(" ")}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3 border-b border-inherit/60 px-4 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
            <Ship className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {booking.vessel_name}
            </h4>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
              <Anchor className="h-3 w-3 shrink-0" strokeWidth={2} />
              {booking.shipping_line_name}
            </p>
          </div>
        </div>
        <span
          className={[
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
            statusBadgeClass(booking),
          ].join(" ")}
        >
          {booking.status_display}
        </span>
      </div>

      <div className="space-y-2 px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 dark:bg-zinc-950/40">
          <MapPin
            className="h-4 w-4 shrink-0 text-[var(--admin-accent)]"
            strokeWidth={2}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Puerto
            </p>
            <p className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {booking.port_name}
            </p>
          </div>
          {!reassignable ? (
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                ETA / ETD
              </p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                <Clock3 className="h-3 w-3 shrink-0 text-zinc-400" aria-hidden />
                {etaEtdLabel}
              </p>
            </div>
          ) : null}
        </div>

        {reassignable ? (
          <div
            className="rounded-xl bg-white/70 px-3 py-2 dark:bg-zinc-950/40"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                ETA / ETD
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FormField
                label="ETA"
                name={`occupancy_eta_${booking.id}`}
                type="time"
                value={eta}
                onChange={(v) => setEta(String(v))}
                onBlur={() => void commitTimes()}
                compact
                disabled={saving}
              />
              <FormField
                label="ETD"
                name={`occupancy_etd_${booking.id}`}
                type="time"
                value={etd}
                onChange={(v) => setEtd(String(v))}
                onBlur={() => void commitTimes()}
                compact
                disabled={saving}
              />
            </div>
          </div>
        ) : null}

        {reassignable ? (
          <div
            className="rounded-xl bg-white/70 px-3 py-2 dark:bg-zinc-950/40"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <FormFieldSelect<number>
              label="Posición"
              name={`occupancy_position_${booking.id}`}
              value={positionId}
              onChange={(v) => void handlePositionChange(v)}
              options={positionOptions}
              optionLabel={
                loadingSuggestions || saving ? "Guardando…" : "Sin asignar"
              }
              emptyValue={0}
              compact
              disabled={saving || loadingSuggestions}
            />
            <PositionOccupancyHint
              message={occupancyHint}
              occupant={
                selectedSuggestion?.occupied ? selectedSuggestion.occupant : null
              }
              positionCode={selectedSuggestion?.code ?? booking.position_code}
              callDate={booking.call_date}
              className="text-[11px]"
            />
            {!saveError ? (
              <p className="mt-1.5 text-[11px] text-zinc-500">
                {saving
                  ? "Guardando…"
                  : "Puedes editar horarios y posición aquí mismo."}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
                {saveError}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-zinc-950/40">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Posición
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-200">
              <LayoutGrid
                className="h-3 w-3 shrink-0 text-zinc-400"
                strokeWidth={2}
              />
              {booking.position_code ?? "Sin asignar"}
            </p>
          </div>
        )}

        <BookingCodeRef
          code={booking.booking_code}
          href={detailHref}
          showLabel={false}
        />

        {booking.blocksSelection ? (
          <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-2.5 py-1.5 text-xs font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            Este barco ya está reservado en esta fecha
          </p>
        ) : null}

        {!booking.isCurrentPort ? (
          <p className="rounded-lg border border-violet-200/80 bg-violet-50/90 px-2.5 py-1.5 text-xs font-medium text-violet-800 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-200">
            Este barco tiene escala en el puerto {booking.port_name} este día
          </p>
        ) : null}
      </div>
    </article>
  );
}
