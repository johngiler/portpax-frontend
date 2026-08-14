"use client";

import { useCallback, useRef, useState } from "react";
import { FormFieldSelect } from "@/components/ui/FormField";
import { fetchPorts } from "@/services/catalogs/portService";
import { fetchShippingLines } from "@/services/catalogs/shippingLineService";
import { fetchVessels } from "@/services/catalogs/vesselService";
import {
  revalidateBulkImportRow,
  type BulkImportPreviewRow,
} from "@/services/bookings/bulkImportService";
import { BOOKING_STATUS_LABELS } from "@/types/booking";
import { applyLtaSpaceClaim } from "./applyLtaSpaceClaim";
import BulkImportRowPositionSelect, {
  fetchRowPositionOccupancy,
} from "./BulkImportRowPositionSelect";
import BulkImportRowIssuesCell from "./BulkImportRowIssuesCell";
import BulkEtaEtdInputs from "./BulkEtaEtdInputs";

type BulkImportStatus = NonNullable<BulkImportPreviewRow["suggested_status"]>;

const STATUS_OPTIONS: { value: BulkImportStatus; label: string }[] = [
  { value: "h", label: BOOKING_STATUS_LABELS.h },
  { value: "co", label: BOOKING_STATUS_LABELS.co },
  { value: "cl", label: BOOKING_STATUS_LABELS.cl },
  { value: "lta", label: BOOKING_STATUS_LABELS.lta },
  { value: "ltd", label: BOOKING_STATUS_LABELS.ltd },
];

function normalizeStatus(
  value: BulkImportPreviewRow["suggested_status"],
): BulkImportStatus {
  if (value && STATUS_OPTIONS.some((o) => o.value === value)) return value;
  return "h";
}

type BulkImportEditableRowProps = {
  row: BulkImportPreviewRow;
  disabled?: boolean;
  checked: boolean;
  onToggle: () => void;
  onRowChange: (next: BulkImportPreviewRow) => void;
};

export default function BulkImportEditableRow({
  row,
  disabled = false,
  checked,
  onToggle,
  onRowChange,
}: BulkImportEditableRowProps) {
  const [revalidating, setRevalidating] = useState(false);
  const [occupancyReloadKey, setOccupancyReloadKey] = useState(0);
  const reqIdRef = useRef(0);
  const rowRef = useRef(row);
  rowRef.current = row;

  const revalidate = useCallback(
    async (draft: BulkImportPreviewRow) => {
      const reqId = ++reqIdRef.current;
      setRevalidating(true);
      try {
        const next = await revalidateBulkImportRow(draft);
        if (reqId !== reqIdRef.current) return;
        onRowChange({
          ...next,
          id: draft.id,
          suggested_status: normalizeStatus(next.suggested_status),
          // Prefer draft occupancy (incl. null after free) — revalidate API may omit it.
          position_occupancy_hint: draft.position_occupancy_hint ?? null,
          position_occupant: draft.position_occupant ?? null,
        });
      } catch {
        if (reqId !== reqIdRef.current) return;
        onRowChange(draft);
      } finally {
        if (reqId === reqIdRef.current) setRevalidating(false);
      }
    },
    [onRowChange],
  );

  const refreshAvisos = useCallback(async () => {
    const current = rowRef.current;
    const occupancy = await fetchRowPositionOccupancy(current);
    const draft = { ...current, ...occupancy };
    onRowChange(draft);
    setOccupancyReloadKey((k) => k + 1);
    await revalidate(draft);
  }, [onRowChange, revalidate]);

  const loadPortOptions = useCallback(async (input: string) => {
    const res = await fetchPorts({ search: input, pageSize: 20 });
    return res.results.map((p) => ({
      value: p.id,
      label: p.name,
    }));
  }, []);

  const loadLineOptions = useCallback(async (input: string) => {
    const res = await fetchShippingLines({ search: input, pageSize: 20 });
    return res.results.map((line) => ({
      value: line.id,
      label: line.name,
    }));
  }, []);

  const loadVesselOptions = useCallback(
    async (input: string) => {
      const res = await fetchVessels({
        search: input,
        pageSize: 20,
        shipping_line: row.shipping_line_id ?? undefined,
      });
      return res.results.map((v) => ({
        value: v.id,
        label: v.name,
      }));
    },
    [row.shipping_line_id],
  );

  const fieldLock = disabled;
  const statusValue = normalizeStatus(row.suggested_status);

  return (
    <tr
      className={
        row.selectable
          ? "bg-white dark:bg-zinc-900/60"
          : "bg-zinc-50/80 dark:bg-zinc-950/40"
      }
    >
      <td className="px-2 py-2 align-top">
        <input
          type="checkbox"
          checked={checked}
          disabled={!row.selectable || fieldLock}
          onChange={onToggle}
          className="mt-1.5 h-3.5 w-3.5 rounded border-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Seleccionar fila ${row.row_number}`}
        />
      </td>
      <td className="min-w-[11rem] px-2 py-1.5 align-top [&_.mb-3]:mb-0">
        <FormFieldSelect<number>
          label=""
          name={`bulk_vessel_${row.id}`}
          value={row.vessel_id ?? 0}
          emptyValue={0}
          optionLabel="Buscar barco…"
          compact
          disabled={fieldLock}
          loadOptions={loadVesselOptions}
          options={
            row.vessel_id
              ? [
                  {
                    value: row.vessel_id,
                    label: row.vessel_name || row.ship || "Barco",
                  },
                ]
              : []
          }
          onChange={(id) => {
            const draft: BulkImportPreviewRow = id
              ? {
                  ...row,
                  vessel_id: id,
                  position_id: null,
                  position_code: null,
                  position_occupancy_hint: null,
                  position_occupant: null,
                  claim_lta_space: false,
                  lta_space_candidate: null,
                }
              : {
                  ...row,
                  vessel_id: null,
                  vessel_name: null,
                  ship: "",
                  position_id: null,
                  position_code: null,
                  position_occupancy_hint: null,
                  position_occupant: null,
                  claim_lta_space: false,
                  lta_space_candidate: null,
                };
            onRowChange(draft);
            void revalidate(draft);
          }}
        />
      </td>
      <td className="min-w-[10rem] px-2 py-1.5 align-top [&_.mb-3]:mb-0">
        <FormFieldSelect<number>
          label=""
          name={`bulk_port_${row.id}`}
          value={row.port_id ?? 0}
          emptyValue={0}
          optionLabel="Buscar puerto…"
          compact
          disabled={fieldLock}
          loadOptions={loadPortOptions}
          options={
            row.port_id
              ? [
                  {
                    value: row.port_id,
                    label: row.port_name || row.port_raw || "Puerto",
                  },
                ]
              : []
          }
          onChange={(id) => {
            const draft: BulkImportPreviewRow = id
              ? {
                  ...row,
                  port_id: id,
                  position_id: null,
                  position_code: null,
                  position_occupancy_hint: null,
                  position_occupant: null,
                  claim_lta_space: false,
                  lta_space_candidate: null,
                }
              : {
                  ...row,
                  port_id: null,
                  port_name: null,
                  port_code: null,
                  port_raw: "",
                  position_id: null,
                  position_code: null,
                  position_occupancy_hint: null,
                  position_occupant: null,
                  claim_lta_space: false,
                  lta_space_candidate: null,
                };
            onRowChange(draft);
            void revalidate(draft);
          }}
        />
      </td>
      <td className="px-2 py-1.5 align-top">
        <input
          type="date"
          value={row.call_date ?? ""}
          disabled={fieldLock}
          onChange={(e) => {
            const draft = {
              ...row,
              call_date: e.target.value || null,
              position_id: null,
              position_code: null,
              position_occupancy_hint: null,
              position_occupant: null,
              claim_lta_space: false,
              lta_space_candidate: null,
            };
            onRowChange(draft);
            void revalidate(draft);
          }}
          className="w-[9.5rem] rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </td>
      <td className="px-2 py-1.5 align-top">
        <BulkEtaEtdInputs
          eta={row.eta}
          etd={row.etd}
          disabled={fieldLock}
          onEtaChange={(value) => onRowChange({ ...row, eta: value })}
          onEtdChange={(value) => onRowChange({ ...row, etd: value })}
          onCommit={({ eta, etd }) => {
            const draft = { ...row, eta, etd };
            onRowChange(draft);
            void revalidate(draft);
          }}
        />
      </td>
      <td className="min-w-[8.5rem] px-2 py-1.5 align-top [&_.mb-3]:mb-0">
        <BulkImportRowPositionSelect
          row={row}
          disabled={
            fieldLock || Boolean(row.claim_lta_space && row.lta_space_candidate)
          }
          reloadKey={occupancyReloadKey}
          onChange={onRowChange}
          onCommit={(draft) => void revalidate(draft)}
        />
      </td>
      <td className="min-w-[11rem] px-2 py-1.5 align-top [&_.mb-3]:mb-0">
        <FormFieldSelect<number>
          label=""
          name={`bulk_line_${row.id}`}
          value={row.shipping_line_id ?? 0}
          emptyValue={0}
          optionLabel="Buscar naviera…"
          compact
          disabled={fieldLock}
          loadOptions={loadLineOptions}
          logoKind="shipping_line"
          options={
            row.shipping_line_id
              ? [
                  {
                    value: row.shipping_line_id,
                    label: row.shipping_line_name || "Naviera",
                  },
                ]
              : []
          }
          onChange={(id) => {
            const draft: BulkImportPreviewRow = id
              ? {
                  ...row,
                  shipping_line_id: id,
                  // Vessel must match the new line — clear until user picks again.
                  vessel_id: null,
                  vessel_name: null,
                  ship: "",
                  position_id: null,
                  position_code: null,
                  position_occupancy_hint: null,
                  position_occupant: null,
                  claim_lta_space: false,
                  lta_space_candidate: null,
                }
              : {
                  ...row,
                  shipping_line_id: null,
                  shipping_line_name: null,
                  vessel_id: null,
                  vessel_name: null,
                  ship: "",
                  position_id: null,
                  position_code: null,
                  position_occupancy_hint: null,
                  position_occupant: null,
                  claim_lta_space: false,
                  lta_space_candidate: null,
                };
            onRowChange(draft);
            void revalidate(draft);
          }}
        />
      </td>
      <td className="min-w-[10rem] px-2 py-1.5 align-top [&_.mb-3]:mb-0">
        <FormFieldSelect<BulkImportStatus>
          label=""
          name={`bulk_status_${row.id}`}
          value={statusValue}
          compact
          disabled={fieldLock}
          options={STATUS_OPTIONS}
          onChange={(value) => {
            const draft = { ...row, suggested_status: value };
            onRowChange(draft);
            void revalidate(draft);
          }}
        />
      </td>
      <td className="min-w-[5.5rem] px-2 py-2 align-top text-center">
        {row.lta_space_candidate ? (
          <input
            type="checkbox"
            checked={Boolean(row.claim_lta_space)}
            disabled={fieldLock}
            onChange={(e) => {
              const draft = applyLtaSpaceClaim(row, e.target.checked);
              onRowChange(draft);
              void revalidate(draft);
            }}
            className="mt-1.5 h-3.5 w-3.5 rounded border-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Reclamar espacio LTA ${row.lta_space_candidate.booking_code}`}
            title={
              [
                "Reclamar espacio LTA",
                row.lta_space_candidate.shipping_line_name ||
                  row.shipping_line_name ||
                  null,
                row.lta_space_candidate.position_code
                  ? `en ${row.lta_space_candidate.position_code}`
                  : null,
                `(${row.lta_space_candidate.booking_code})`,
              ]
                .filter(Boolean)
                .join(" ")
            }
          />
        ) : (
          <span className="text-[10px] text-zinc-300 dark:text-zinc-600">—</span>
        )}
      </td>
      <td className="min-w-[7rem] px-2 py-2 align-top">
        <BulkImportRowIssuesCell
          row={row}
          revalidating={revalidating}
          onRefreshAvisos={refreshAvisos}
          onClaimLtaSpace={() => {
            const draft = applyLtaSpaceClaim(row, true);
            onRowChange(draft);
            return revalidate(draft);
          }}
        />
      </td>
    </tr>
  );
}
