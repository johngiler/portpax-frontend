"use client";

import { useCallback, useEffect, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import {
  suggestBookingPositions,
  updateBooking,
} from "@/services/bookings/bookingService";
import type { Booking, PositionSuggestion } from "@/types/booking";

type BookingOperationalSectionProps = {
  booking: Booking;
  onUpdated: (booking: Booking) => void;
  onError: (message: string | null) => void;
};

export default function BookingOperationalSection({
  booking,
  onUpdated,
  onError,
}: BookingOperationalSectionProps) {
  const [positionId, setPositionId] = useState(booking.position ?? 0);
  const [eta, setEta] = useState(booking.eta?.slice(0, 5) ?? "");
  const [etd, setEtd] = useState(booking.etd?.slice(0, 5) ?? "");
  const [plannedPax, setPlannedPax] = useState(
    booking.planned_pax != null ? String(booking.planned_pax) : "",
  );
  const [actualPax, setActualPax] = useState(
    booking.actual_pax != null ? String(booking.actual_pax) : "",
  );
  const [suggestions, setSuggestions] = useState<PositionSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);

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
  }, [booking.position]);

  useEffect(() => {
    if (booking.status !== "cancelled") {
      loadSuggestions();
    }
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
      });
      onUpdated(updated);
    } catch (err) {
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

      {booking.folio ? (
        <p className="mt-3 text-sm font-medium text-[var(--admin-accent)]">
          Folio: {booking.folio}
        </p>
      ) : null}

      {booking.confirmation_pdf_url ? (
        <a
          href={booking.confirmation_pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex text-sm font-medium text-[var(--admin-accent)] hover:underline"
        >
          Descargar confirmación PDF
        </a>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FormFieldSelect<number>
          label="Posición"
          name="booking_position"
          value={positionId}
          onChange={setPositionId}
          options={positionOptions}
          optionLabel={loadingSuggestions ? "Cargando…" : "Sin asignar"}
          emptyValue={0}
          disabled={booking.status === "cancelled"}
        />
        <FormField
          label="ETA"
          name="booking_eta"
          type="text"
          value={eta}
          onChange={(value) => setEta(String(value))}
          placeholder="08:00"
          disabled={booking.status === "cancelled"}
        />
        <FormField
          label="ETD"
          name="booking_etd"
          type="text"
          value={etd}
          onChange={(value) => setEtd(String(value))}
          placeholder="18:00"
          disabled={booking.status === "cancelled"}
        />
        <FormField
          label="PAX planificado"
          name="booking_planned_pax"
          type="number"
          min={0}
          value={plannedPax}
          onChange={(value) => setPlannedPax(String(value))}
          disabled={booking.status === "cancelled"}
        />
        <FormField
          label="PAX real (post-arribo)"
          name="booking_actual_pax"
          type="number"
          min={0}
          value={actualPax}
          onChange={(value) => setActualPax(String(value))}
        />
      </div>

      {suggestions.some((position) => position.warnings.length > 0) ? (
        <ul className="mt-3 space-y-1 text-xs text-amber-700 dark:text-amber-300">
          {suggestions
            .filter((position) => position.warnings.length > 0)
            .flatMap((position) =>
              position.warnings.map((warning) => (
                <li key={`${position.code}-${warning.code}`}>
                  {position.code}: {warning.message}
                </li>
              )),
            )}
        </ul>
      ) : null}

      {booking.status !== "cancelled" ? (
        <div className="mt-4">
          <DefaultButton type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando…" : "Guardar operación"}
          </DefaultButton>
        </div>
      ) : null}
    </section>
  );
}
