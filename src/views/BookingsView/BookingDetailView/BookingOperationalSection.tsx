"use client";

import { useCallback, useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import NoticeAlert from "@/components/ui/NoticeAlert";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/services/apiClient";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { canAuthorizeExceptions } from "@/lib/navAccess";
import {
  suggestBookingPositions,
  updateBooking,
} from "@/services/bookings/bookingService";
import type { Booking, PositionSuggestion } from "@/types/booking";

type BookingOperationalSectionProps = {
  booking: Booking;
  onUpdated: (booking: Booking) => void;
  onError: (message: string | null) => void;
  canWrite?: boolean;
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
  const [clOverride, setClOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [ackCombinedRed, setAckCombinedRed] = useState(false);
  const [needsCombinedRedAck, setNeedsCombinedRedAck] = useState(false);

  const readOnly = !canWrite || booking.status === "c";
  const isCl = booking.status === "cl";
  const scheduleLocked = isCl && !mayAuthorize;
  const scheduleReadOnly = readOnly || scheduleLocked;

  const scheduleDirty =
    (positionId > 0 ? positionId : null) !== (booking.position ?? null) ||
    (eta || "") !== (booking.eta?.slice(0, 5) ?? "") ||
    (etd || "") !== (booking.etd?.slice(0, 5) ?? "");

  const loadSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    try {
      const data = await suggestBookingPositions({
        port: booking.port,
        vessel: booking.vessel,
        call_date: booking.call_date,
      });
      setSuggestions(data.positions);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [booking.port, booking.vessel, booking.call_date]);

  useEffect(() => {
    setPositionId(booking.position ?? 0);
    setEta(booking.eta?.slice(0, 5) ?? "");
    setEtd(booking.etd?.slice(0, 5) ?? "");
    setPlannedPax(booking.planned_pax != null ? String(booking.planned_pax) : "");
    setActualPax(booking.actual_pax != null ? String(booking.actual_pax) : "");
    setActualCrew(booking.actual_crew != null ? String(booking.actual_crew) : "");
    setClOverride(false);
    setOverrideReason("");
    setAckCombinedRed(false);
    setNeedsCombinedRedAck(false);
  }, [booking]);

  useEffect(() => {
    if (booking.status !== "c") {
      loadSuggestions();
    }
  }, [booking.status, loadSuggestions]);

  async function handleSave() {
    if (isCl && scheduleDirty && mayAuthorize && !clOverride) {
      onError("Marca la autorización para cambiar un call CL (LTA).");
      return;
    }

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
        port_operator_override: isCl && scheduleDirty ? clOverride : undefined,
        override_reason:
          isCl && scheduleDirty && overrideReason.trim()
            ? overrideReason.trim()
            : undefined,
        acknowledge_combined_red: ackCombinedRed || undefined,
      });
      onUpdated(updated);
      setNeedsCombinedRedAck(false);
      setAckCombinedRed(false);
      setClOverride(false);
      setOverrideReason("");
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

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Operación y posición
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        La posición se calcula al crear la reserva (LOA, calado y disponibilidad).
        Puedes ajustarla manualmente si hace falta.
      </p>

      {isCl && scheduleLocked ? (
        <NoticeAlert
          variant="warning"
          className="mt-3"
          messages={[
            "Call CL (LTA): posición y ETA/ETD son inamovibles. Solo un port-operator o admin puede autorizar el cambio (RN-06).",
          ]}
        />
      ) : null}

      {booking.confirmation_pdf_url ? (
        <a
          href={booking.confirmation_pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex text-sm font-medium text-[var(--admin-accent)] hover:underline"
        >
          Descargar confirmación PDF
        </a>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
        <p className="-mt-2 text-xs text-zinc-500 dark:text-zinc-400 sm:col-span-2">
          PAX real = total absoluto de pasajeros desembarcados (no el delta del Excel).
        </p>
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

      {isCl && mayAuthorize && !readOnly && scheduleDirty ? (
        <div className="mt-4 space-y-3 rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
          <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-800 dark:text-zinc-100">
            <input
              type="checkbox"
              checked={clOverride}
              onChange={(e) => setClOverride(e.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-[var(--admin-border)]"
            />
            <span className="font-medium">
              Autorizar cambio en call CL (LTA)
            </span>
          </label>
          <FormField
            label="Motivo del override (opcional)"
            name="override_reason"
            type="text"
            value={overrideReason}
            onChange={(value) => setOverrideReason(String(value))}
            placeholder="Motivo para auditoría"
          />
        </div>
      ) : null}

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

      {suggestions.some((position) => position.warnings.length > 0) ? (
        <NoticeAlert
          variant="warning"
          className="mt-3"
          messages={suggestions
            .filter((position) => position.warnings.length > 0)
            .flatMap((position) =>
              position.warnings.map((warning) => `${position.code}: ${warning.message}`),
            )}
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
