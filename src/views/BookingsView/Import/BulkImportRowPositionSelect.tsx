"use client";

import { useEffect, useRef, useState } from "react";
import { FormFieldSelect } from "@/components/ui/FormField";
import { positionOccupancyHint } from "@/lib/positionOccupancyHint";
import { suggestBookingPositions } from "@/services/bookings/bookingService";
import type { BulkImportPreviewRow } from "@/services/bookings/bulkImportService";
import type { PositionOccupant, PositionSuggestion } from "@/types/booking";

type BulkImportRowPositionSelectProps = {
  row: BulkImportPreviewRow;
  disabled?: boolean;
  onChange: (draft: BulkImportPreviewRow) => void;
  onCommit: (draft: BulkImportPreviewRow) => void;
  /** Bump to invalidate cached suggestions (e.g. after revalidate). */
  reloadKey?: number;
};

function occupancyFields(
  options: PositionSuggestion[],
  positionId: number | null,
  callDate: string | null,
): {
  position_occupancy_hint: string | null;
  position_occupant: PositionOccupant | null;
} {
  const selected =
    positionId != null ? options.find((p) => p.id === positionId) : undefined;
  if (!selected?.occupied) {
    return { position_occupancy_hint: null, position_occupant: null };
  }
  const occupant: PositionOccupant = {
    booking_id: selected.occupant?.booking_id ?? 0,
    booking_code: selected.occupant?.booking_code ?? "",
    status: selected.occupant?.status ?? "",
    vessel_name: selected.occupant?.vessel_name ?? "",
    shipping_line_name: selected.occupant?.shipping_line_name ?? "",
    position_code:
      selected.occupant?.position_code || selected.code || null,
    call_date: selected.occupant?.call_date || callDate || null,
    eta: selected.occupant?.eta ?? null,
    etd: selected.occupant?.etd ?? null,
  };
  return {
    position_occupancy_hint: positionOccupancyHint({
      occupied: true,
      occupant,
    }),
    position_occupant: occupant,
  };
}

function mapPositionOptions(positions: PositionSuggestion[]) {
  return positions.map((position) => {
    const tags: string[] = [];
    if (position.recommended) tags.push("sugerida");
    if (position.occupied) tags.push("ocupada");
    const suffix = tags.length > 0 ? ` (${tags.join(", ")})` : "";
    return {
      value: position.id,
      label: `${position.code}${suffix}`,
    };
  });
}

export async function fetchRowPositionOccupancy(
  row: BulkImportPreviewRow,
): Promise<{
  position_occupancy_hint: string | null;
  position_occupant: PositionOccupant | null;
}> {
  if (!row.port_id || !row.vessel_id || !row.call_date) {
    return { position_occupancy_hint: null, position_occupant: null };
  }
  try {
    const exclude =
      typeof row.row_number === "number" && row.row_number > 0
        ? row.row_number
        : undefined;
    const data = await suggestBookingPositions({
      port: row.port_id,
      vessel: row.vessel_id,
      call_date: row.call_date,
      exclude_booking: exclude,
    });
    return occupancyFields(
      data.positions,
      row.position_id ?? null,
      row.call_date,
    );
  } catch {
    return { position_occupancy_hint: null, position_occupant: null };
  }
}

export default function BulkImportRowPositionSelect({
  row,
  disabled = false,
  onChange,
  onCommit,
  reloadKey = 0,
}: BulkImportRowPositionSelectProps) {
  const [suggestions, setSuggestions] = useState<PositionSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchedKeyRef = useRef("");
  const inflightRef = useRef<string | null>(null);
  const rowRef = useRef(row);
  rowRef.current = row;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const catalogKey = `${row.port_id}|${row.vessel_id}|${row.call_date}|${reloadKey}`;
  const catalogKeyRef = useRef(catalogKey);
  catalogKeyRef.current = catalogKey;

  useEffect(() => {
    setSuggestions([]);
    fetchedKeyRef.current = "";
    inflightRef.current = null;
  }, [catalogKey]);

  const ensureLoaded = async () => {
    if (!row.port_id || !row.vessel_id || !row.call_date) return;
    if (fetchedKeyRef.current === catalogKey) return;
    if (inflightRef.current === catalogKey) return;
    const requestKey = catalogKey;
    inflightRef.current = requestKey;
    setLoading(true);
    try {
      const exclude =
        typeof row.row_number === "number" && row.row_number > 0
          ? row.row_number
          : undefined;
      const data = await suggestBookingPositions({
        port: row.port_id,
        vessel: row.vessel_id,
        call_date: row.call_date,
        exclude_booking: exclude,
      });
      if (requestKey !== catalogKeyRef.current) return;
      fetchedKeyRef.current = requestKey;
      setSuggestions(data.positions);
      const current = rowRef.current;
      const next = occupancyFields(
        data.positions,
        current.position_id ?? null,
        current.call_date,
      );
      if (
        next.position_occupancy_hint !==
          (current.position_occupancy_hint ?? null) ||
        next.position_occupant?.booking_id !==
          current.position_occupant?.booking_id ||
        next.position_occupant?.status !== current.position_occupant?.status ||
        next.position_occupant?.eta !== current.position_occupant?.eta ||
        next.position_occupant?.etd !== current.position_occupant?.etd ||
        Boolean(next.position_occupant) !== Boolean(current.position_occupant)
      ) {
        onChangeRef.current({ ...current, ...next });
      }
    } catch {
      if (requestKey === catalogKeyRef.current) {
        fetchedKeyRef.current = requestKey;
        setSuggestions([]);
      }
    } finally {
      if (inflightRef.current === requestKey) inflightRef.current = null;
      if (requestKey === catalogKeyRef.current) setLoading(false);
    }
  };

  const selectOptions = mapPositionOptions(suggestions);
  if (
    row.position_id != null &&
    row.position_code &&
    !selectOptions.some((o) => o.value === row.position_id)
  ) {
    selectOptions.unshift({
      value: row.position_id,
      label: row.position_code,
    });
  }

  return (
    <FormFieldSelect<number>
      label=""
      name={`bulk_position_${row.id}`}
      value={row.position_id ?? 0}
      emptyValue={0}
      optionLabel={loading ? "Cargando…" : "Auto"}
      compact
      disabled={
        disabled || !row.port_id || !row.vessel_id || !row.call_date
      }
      options={selectOptions}
      onMenuOpen={() => {
        void ensureLoaded();
      }}
      onChange={(id) => {
        if (!id) {
          const draft = {
            ...row,
            position_id: null,
            position_code: null,
            ...occupancyFields(suggestions, null, row.call_date),
          };
          onChange(draft);
          onCommit(draft);
          return;
        }
        const match = suggestions.find((p) => p.id === id);
        const draft = {
          ...row,
          position_id: id,
          position_code: match?.code ?? row.position_code ?? String(id),
          ...occupancyFields(suggestions, id, row.call_date),
        };
        onChange(draft);
        onCommit(draft);
      }}
    />
  );
}
