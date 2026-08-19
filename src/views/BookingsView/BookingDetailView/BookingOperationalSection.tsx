"use client";

import { useCallback, useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import PositionOccupancyHint from "@/components/booking/PositionOccupancyHint";
import ValidationIssuesAlert from "@/components/booking/ValidationIssuesAlert";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/services/apiClient";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { canAuthorizeExceptions } from "@/lib/navAccess";
import {
  suggestBookingPositions,
  updateBooking,
} from "@/services/bookings/bookingService";
import type {
  Booking,
  BookingValidationIssue,
  PositionSuggestion,
} from "@/types/booking";
import { issueSeverity } from "@/lib/bookingConflictSeverity";

type BookingOperationalSectionProps = {
  booking: Booking;
  onUpdated: (booking: Booking) => void;
  onError: (message: string | null) => void;
  canWrite?: boolean;
  returnTo?: string | null;
};

function apiErrorMentionsCode(err: unknown, code: string): boolean {
  if (!(err instanceof ApiError)) return false;
  const blob = `${err.message} ${JSON.stringify(err.fieldErrors ?? {})}`;
  return blob.includes(code);
}

export default function BookingOperationalSection({
  booking,
  onUpdated,
  onError,
  canWrite = true,
  returnTo = null,
}: BookingOperationalSectionProps) {
  const { user } = useAuth();
  const mayAuthorize = canAuthorizeExceptions(user?.role);

  const [positionId, setPositionId] = useState(booking.position ?? 0);
  const [eta, setEta] = useState(booking.eta?.slice(0, 5) ?? "");
  const [etd, setEtd] = useState(booking.etd?.slice(0, 5) ?? "");
  const [plannedPax, setPlannedPax] = useState(
    booking.planned_pax != null ? String(booking.planned_pax) : "",
  );
  const [actualPax, setActualPax] = useState(
    booking.actual_pax != null ? String(booking.actual_pax) : "",
  );
  const [actualCrew, setActualCrew] = useState(
    booking.actual_crew != null ? String(booking.actual_crew) : "",
  );
  const [suggestions, setSuggestions] = useState<PositionSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ackCombinedRed, setAckCombinedRed] = useState(false);
  const [needsCombinedRedAck, setNeedsCombinedRedAck] = useState(false);

  const readOnly = !canWrite || booking.status === "c";
  const scheduleReadOnly = readOnly;

  const loadSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    try {
      const data = await suggestBookingPositions({
        port: booking.port,
        vessel: booking.vessel,
        call_date: booking.call_date,
        exclude_booking: booking.id,
        eta: eta || null,
        etd: etd || null,
      });
      setSuggestions(data.positions);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [booking.port, booking.vessel, booking.call_date, booking.id, eta, etd]);

  useEffect(() => {
    setPositionId(booking.position ?? 0);
    setEta(booking.eta?.slice(0, 5) ?? "");
    setEtd(booking.etd?.slice(0, 5) ?? "");
    setPlannedPax(booking.planned_pax != null ? String(booking.planned_pax) : "");
    setActualPax(booking.actual_pax != null ? String(booking.actual_pax) : "");
    setActualCrew(booking.actual_crew != null ? String(booking.actual_crew) : "");
    setAckCombinedRed(false);
    setNeedsCombinedRedAck(false);
  }, [booking]);

  useEffect(() => {
    if (booking.status === "c") return;
    const timer = window.setTimeout(() => {
      void loadSuggestions();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [booking.status, loadSuggestions]);

  async function handleSave() {
    setSaving(true);
    onError(null);
    try {
      const updated = await updateBooking(booking.id, {
        position: positionId > 0 ? positionId : null,
        eta: eta || null,
        etd: etd || null,
        planned_pax: plannedPax === "" ? null : Number(plannedPax),
        actual_pax: actualPax === "" ? null : Number(actualPax),
        actual_crew: actualCrew === "" ? null : Number(actualCrew),
        acknowledge_combined_red: ackCombinedRed || undefined,
      });
      onUpdated(updated);
      setNeedsCombinedRedAck(false);
      setAckCombinedRed(false);
    } catch (err) {
      if (apiErrorMentionsCode(err, "combined_loa_red")) {
        setNeedsCombinedRedAck(true);
      }
      onError(
        getApiErrorMessage(err, "No se pudo guardar la información operativa."),
      );
    } finally {
      setSaving(false);
    }
  }

  const positionOptions = suggestions.map((position) => {
    const tags: string[] = [];
    if (position.recommended) tags.push("recomendada");
    if (position.occupied) tags.push("ocupada");
    const suffix = tags.length > 0 ? ` (${tags.join(", ")})` : "";
    return {
      value: position.id,
      label: `${position.code}${suffix}`,
    };
  });

  const selectedSuggestion = suggestions.find((p) => p.id === positionId);
  // LTA / CL / LTD already sit on the LTA track — horizon soft-fails are noise here.
  const ltaTrack = booking.status === "lta" || booking.status === "cl" || booking.status === "ltd";
  const liveWarnings = (selectedSuggestion?.warnings ?? []).filter((warning) => {
    if (!ltaTrack) return true;
    return (
      warning.code !== "lta_beyond_horizon" &&
      warning.code !== "lta_horizon_denied"
    );
  });
  const snapshotIssues: BookingValidationIssue[] = (
    booking.conflict_snapshot ?? []
  ).map((item) => ({
    level: item.level ?? "warning",
    code: item.code,
    message: item.message,
    severity: issueSeverity(item),
    detail: item.detail,
  }));
  const liveNormalized = liveWarnings.map((warning) => ({
    ...warning,
    severity: issueSeverity(warning),
  }));
  // Live suggestions win per code; keep snapshot codes missing from live
  // (e.g. schedule rules if suggest was called without ETA).
  const sameSavedPosition = positionId === (booking.position ?? 0);
  const displayIssues = (() => {
    const byCode = new Map<string, BookingValidationIssue>();
    if (sameSavedPosition) {
      for (const item of snapshotIssues) {
        byCode.set(item.code || item.message, item);
      }
    }
    for (const item of liveNormalized) {
      byCode.set(item.code || item.message, item);
    }
    return Array.from(byCode.values());
  })();

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Operación y posición
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        La posición se calcula al crear la reserva (LOA, calado y disponibilidad).
        Puedes ajustarla manualmente si hace falta.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <FormFieldSelect<number>
            label="Reasignar posición"
            name="booking_position"
            value={positionId}
            onChange={setPositionId}
            options={positionOptions}
            optionLabel={loadingSuggestions ? "Cargando…" : "Sin asignar"}
            emptyValue={0}
            disabled={scheduleReadOnly}
          />
          <PositionOccupancyHint
            occupant={
              selectedSuggestion?.occupied
                ? selectedSuggestion.occupant
                : null
            }
            positionCode={selectedSuggestion?.code}
            callDate={booking.call_date}
          />
        </div>
        <FormField
          label="ETA"
          name="booking_eta"
          type="text"
          value={eta}
          onChange={(value) => setEta(String(value))}
          placeholder="08:00"
          disabled={scheduleReadOnly}
        />
        <FormField
          label="ETD"
          name="booking_etd"
          type="text"
          value={etd}
          onChange={(value) => setEtd(String(value))}
          placeholder="18:00"
          disabled={scheduleReadOnly}
        />
        <FormField
          label="PAX planificado"
          name="booking_planned_pax"
          type="number"
          min={0}
          value={plannedPax}
          onChange={(value) => setPlannedPax(String(value))}
          disabled={readOnly}
        />
        <FormField
          label="PAX real (desembarcados)"
          name="booking_actual_pax"
          type="number"
          min={0}
          value={actualPax}
          onChange={(value) => setActualPax(String(value))}
          disabled={readOnly}
        />
        <FormField
          label="Tripulación real (post-arribo)"
          name="booking_actual_crew"
          type="number"
          min={0}
          value={actualCrew}
          onChange={(value) => setActualCrew(String(value))}
          disabled={readOnly}
        />
      </div>

      {needsCombinedRedAck ? (
        <div className="mt-4 space-y-2 rounded-xl border border-red-200/80 bg-red-50/60 p-4 dark:border-red-900/40 dark:bg-red-950/30">
          {mayAuthorize ? (
            <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-800 dark:text-zinc-100">
              <input
                type="checkbox"
                checked={ackCombinedRed}
                onChange={(e) => setAckCombinedRed(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer rounded border-[var(--admin-border)]"
              />
              <span className="font-medium">
                Autorizar zona roja de LOA combinada (RN-05)
              </span>
            </label>
          ) : (
            <p className="text-sm text-red-800 dark:text-red-300">
              LOA combinada en zona roja: solo un port-operator o admin puede
              autorizar este cambio.
            </p>
          )}
        </div>
      ) : null}

      {displayIssues.length > 0 ? (
        <ValidationIssuesAlert
          className="mt-4"
          warnings={displayIssues}
          returnTo={returnTo}
        />
      ) : null}

      {canWrite && booking.status !== "c" ? (
        <div className="mt-4">
          <DefaultButton type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando…" : "Guardar operación"}
          </DefaultButton>
        </div>
      ) : null}
    </section>
  );
}
