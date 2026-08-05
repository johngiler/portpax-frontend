"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { FormFieldSelect } from "@/components/ui/FormField";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import { formatTimeShort } from "@/lib/bookingDisplay";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { swrKeys } from "@/lib/swr/keys";
import {
  fetchAllBookings,
  suggestBookingPositions,
  updateBooking,
} from "@/services/bookings/bookingService";
import type { Booking, PositionSuggestion } from "@/types/booking";

type ReviewDayPeersPanelProps = {
  portId: number;
  vesselId: number;
  callDates: string[];
};

type PeerRowProps = {
  booking: Booking;
  onChanged: () => void;
};

function PeerRow({ booking, onChanged }: PeerRowProps) {
  const [positionId, setPositionId] = useState(booking.position ?? 0);
  const [suggestions, setSuggestions] = useState<PositionSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPositionId(booking.position ?? 0);
  }, [booking.position, booking.id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    suggestBookingPositions({
      port: booking.port,
      vessel: booking.vessel,
      call_date: booking.call_date,
    })
      .then((data) => {
        if (!cancelled) setSuggestions(data.positions);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [booking.port, booking.vessel, booking.call_date]);

  async function handleChange(nextId: number) {
    setPositionId(nextId);
    if (nextId === (booking.position ?? 0)) return;
    setSaving(true);
    setError(null);
    try {
      await updateBooking(booking.id, {
        position: nextId > 0 ? nextId : null,
      });
      onChanged();
    } catch (err) {
      setPositionId(booking.position ?? 0);
      setError(getApiErrorMessage(err, "No se pudo reasignar."));
    } finally {
      setSaving(false);
    }
  }

  const options = suggestions.map((position) => {
    const tags: string[] = [];
    if (position.recommended) tags.push("recomendada");
    if (position.occupied) tags.push("ocupada");
    const suffix = tags.length > 0 ? ` (${tags.join(", ")})` : "";
    return { value: position.id, label: `${position.code}${suffix}` };
  });

  return (
    <li className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {booking.vessel_name}
          </p>
          <p className="text-xs text-zinc-500">
            {formatIsoDateLabel(booking.call_date, "short")} ·{" "}
            {formatTimeShort(booking.eta)}–{formatTimeShort(booking.etd)}
          </p>
        </div>
        <code className="truncate text-[10px] text-zinc-400">
          {booking.booking_code}
        </code>
      </div>
      <div className="mt-2">
        <FormFieldSelect<number>
          label="Posición"
          name={`review_peer_pos_${booking.id}`}
          value={positionId}
          onChange={(v) => void handleChange(v)}
          options={options}
          optionLabel={loading || saving ? "Cargando…" : "Sin asignar"}
          emptyValue={0}
          compact
          disabled={saving || loading || booking.status === "c"}
        />
        {error ? (
          <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export default function ReviewDayPeersPanel({
  portId,
  vesselId,
  callDates,
}: ReviewDayPeersPanelProps) {
  const range = useMemo(() => {
    if (callDates.length === 0) return null;
    const sorted = [...callDates].sort();
    return { from: sorted[0], to: sorted[sorted.length - 1] };
  }, [callDates]);

  const dateSet = useMemo(() => new Set(callDates), [callDates]);

  const { data, isLoading, mutate } = useSWR(
    portId > 0 && range
      ? swrKeys.wizardDayPeers(portId, range.from, range.to)
      : null,
    async () =>
      fetchAllBookings({
        port: portId,
        call_date_from: range!.from,
        call_date_to: range!.to,
        ordering: "call_date",
        pageSize: 500,
      }),
  );

  const peers = useMemo(() => {
    if (!data) return [];
    const filtered = data.filter(
      (b) =>
        b.status !== "c" &&
        dateSet.has(b.call_date) &&
        b.vessel !== vesselId,
    );
    filtered.sort(
      (a, b) =>
        a.call_date.localeCompare(b.call_date) ||
        a.vessel_name.localeCompare(b.vessel_name),
    );
    return filtered;
  }, [data, dateSet, vesselId]);

  if (isLoading && peers.length === 0) {
    return (
      <p className="text-xs text-zinc-500">Cargando otras escalas del día…</p>
    );
  }

  if (peers.length === 0) return null;

  return (
    <div className="border-t border-zinc-200/80 px-5 py-4 dark:border-zinc-800">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Otras escalas en estas fechas
      </h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Puedes reasignar posiciones de barcos ya existentes para liberar muelle
        antes de crear la nueva reserva.
      </p>
      <ul className="mt-3 space-y-2">
        {peers.map((booking) => (
          <PeerRow
            key={booking.id}
            booking={booking}
            onChanged={() => {
              void mutate();
            }}
          />
        ))}
      </ul>
    </div>
  );
}
