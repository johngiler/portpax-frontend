"use client";

import { useEffect, useState } from "react";
import { FormFieldSelect } from "@/components/ui/FormField";
import { suggestBookingPositions } from "@/services/bookings/bookingService";
import type { BulkImportPreviewRow } from "@/services/bookings/bulkImportService";
import type { PositionSuggestion } from "@/types/booking";

type BulkImportRowPositionSelectProps = {
  row: BulkImportPreviewRow;
  disabled?: boolean;
  onChange: (draft: BulkImportPreviewRow) => void;
  onCommit: (draft: BulkImportPreviewRow) => void;
};

export default function BulkImportRowPositionSelect({
  row,
  disabled = false,
  onChange,
  onCommit,
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
        if (!cancelled) setOptions(data.positions);
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
  }, [row.port_id, row.vessel_id, row.call_date]);

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
          const draft = { ...row, position_id: null, position_code: null };
          onChange(draft);
          onCommit(draft);
          return;
        }
        const match = options.find((p) => p.id === id);
        const draft = {
          ...row,
          position_id: id,
          position_code: match?.code ?? row.position_code ?? String(id),
        };
        onChange(draft);
        onCommit(draft);
      }}
    />
  );
}
