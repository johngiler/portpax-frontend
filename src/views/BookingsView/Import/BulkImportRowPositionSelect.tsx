"use client";

import { useEffect, useRef } from "react";
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
    const data = await suggestBookingPositions({
      port: row.port_id,
      vessel: row.vessel_id,
      call_date: row.call_date,
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
  const optionsRef = useRef<PositionSuggestion[]>([]);
  const cacheKeyRef = useRef("");
  const rowRef = useRef(row);
  rowRef.current = row;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const catalogKey = `${row.port_id}|${row.vessel_id}|${row.call_date}|${reloadKey}`;

  useEffect(() => {
    optionsRef.current = [];
    cacheKeyRef.current = "";
  }, [catalogKey]);

  const seedOptions =
    row.position_id != null && row.position_code
      ? [{ value: row.position_id, label: row.position_code }]
      : [];

  return (
    <FormFieldSelect<number>
      key={catalogKey}
      label=""
      name={`bulk_position_${row.id}`}
      value={row.position_id ?? 0}
      emptyValue={0}
      optionLabel="Sin posición"
      compact
      disabled={
        disabled || !row.port_id || !row.vessel_id || !row.call_date
      }
      options={seedOptions}
      loadOptions={async (inputValue) => {
        if (!row.port_id || !row.vessel_id || !row.call_date) return seedOptions;
        if (cacheKeyRef.current !== catalogKey) {
          const data = await suggestBookingPositions({
            port: row.port_id,
            vessel: row.vessel_id,
            call_date: row.call_date,
          });
          optionsRef.current = data.positions;
          cacheKeyRef.current = catalogKey;
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
            next.position_occupant?.status !==
              current.position_occupant?.status ||
            next.position_occupant?.eta !== current.position_occupant?.eta ||
            next.position_occupant?.etd !== current.position_occupant?.etd ||
            Boolean(next.position_occupant) !==
              Boolean(current.position_occupant)
          ) {
            onChangeRef.current({ ...current, ...next });
          }
        }
        const mapped = mapPositionOptions(optionsRef.current);
        const q = inputValue.trim().toLowerCase();
        if (!q) return mapped;
        return mapped.filter((opt) => opt.label.toLowerCase().includes(q));
      }}
      onChange={(id) => {
        const cached = optionsRef.current;
        if (!id) {
          const draft = {
            ...row,
            position_id: null,
            position_code: null,
            ...occupancyFields(cached, null, row.call_date),
          };
          onChange(draft);
          onCommit(draft);
          return;
        }
        const match = cached.find((p) => p.id === id);
        const draft = {
          ...row,
          position_id: id,
          position_code: match?.code ?? row.position_code ?? String(id),
          ...occupancyFields(cached, id, row.call_date),
        };
        onChange(draft);
        onCommit(draft);
      }}
    />
  );
}
