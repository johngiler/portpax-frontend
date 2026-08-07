"use client";

import { useEffect, useState } from "react";
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
  /** Bump to refetch suggestions / occupancy (e.g. after editing booking in another tab). */
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
  const [options, setOptions] = useState<PositionSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!row.port_id || !row.vessel_id || !row.call_date) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    suggestBookingPositions({
      port: row.port_id,
      vessel: row.vessel_id,
      call_date: row.call_date,
    })
      .then((data) => {
        if (cancelled) return;
        setOptions(data.positions);
        const next = occupancyFields(
          data.positions,
          row.position_id ?? null,
          row.call_date,
        );
        if (
          next.position_occupancy_hint !== (row.position_occupancy_hint ?? null) ||
          next.position_occupant?.booking_id !== row.position_occupant?.booking_id ||
          next.position_occupant?.status !== row.position_occupant?.status ||
          next.position_occupant?.eta !== row.position_occupant?.eta ||
          next.position_occupant?.etd !== row.position_occupant?.etd ||
          Boolean(next.position_occupant) !== Boolean(row.position_occupant)
        ) {
          onChange({ ...row, ...next });
        }
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when catalog keys / reload change
  }, [row.port_id, row.vessel_id, row.call_date, row.position_id, reloadKey]);

  const selectOptions = options.map((position) => {
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
      optionLabel={loading ? "Cargando…" : "Sin posición"}
      compact
      disabled={
        disabled || loading || !row.port_id || !row.vessel_id || !row.call_date
      }
      options={selectOptions}
      onChange={(id) => {
        if (!id) {
          const draft = {
            ...row,
            position_id: null,
            position_code: null,
            ...occupancyFields(options, null, row.call_date),
          };
          onChange(draft);
          onCommit(draft);
          return;
        }
        const match = options.find((p) => p.id === id);
        const draft = {
          ...row,
          position_id: id,
          position_code: match?.code ?? row.position_code ?? String(id),
          ...occupancyFields(options, id, row.call_date),
        };
        onChange(draft);
        onCommit(draft);
      }}
    />
  );
}
