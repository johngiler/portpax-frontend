"use client";

import { useCallback, useRef, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { FormFieldSelect } from "@/components/ui/FormField";
import { fetchPorts } from "@/services/catalogs/portService";
import { fetchShippingLines } from "@/services/catalogs/shippingLineService";
import { fetchVessels } from "@/services/catalogs/vesselService";
import {
  revalidateBulkImportRow,
  type BulkImportPreviewRow,
} from "@/services/bookings/bulkImportService";
import { BOOKING_STATUS_LABELS } from "@/types/booking";

type BulkImportStatus = NonNullable<BulkImportPreviewRow["suggested_status"]>;

const STATUS_OPTIONS: { value: BulkImportStatus; label: string }[] = [
  { value: "h", label: BOOKING_STATUS_LABELS.h },
  { value: "co", label: BOOKING_STATUS_LABELS.co },
  { value: "cl", label: BOOKING_STATUS_LABELS.cl },
  { value: "lta", label: BOOKING_STATUS_LABELS.lta },
  { value: "ltd", label: BOOKING_STATUS_LABELS.ltd },
];

function toTimeInput(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 5);
}

function fromTimeInput(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  return t.length === 5 ? `${t}:00` : t;
}

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
  const reqIdRef = useRef(0);

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

  const busy = disabled || revalidating;
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
          disabled={!row.selectable || busy}
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
          disabled={busy}
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
              ? { ...row, vessel_id: id }
              : {
                  ...row,
                  vessel_id: null,
                  vessel_name: null,
                  ship: "",
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
          disabled={busy}
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
              ? { ...row, port_id: id }
              : {
                  ...row,
                  port_id: null,
                  port_name: null,
                  port_code: null,
                  port_raw: "",
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
          disabled={busy}
          onChange={(e) => {
            const draft = { ...row, call_date: e.target.value || null };
            onRowChange(draft);
            void revalidate(draft);
          }}
          className="w-[9.5rem] rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </td>
      <td className="px-2 py-1.5 align-top">
        <div className="flex items-center gap-1">
          <input
            type="time"
            value={toTimeInput(row.eta)}
            disabled={busy}
            onChange={(e) => {
              const draft = { ...row, eta: fromTimeInput(e.target.value) };
              onRowChange(draft);
              void revalidate(draft);
            }}
            className="w-[6.5rem] rounded-md border border-zinc-200 bg-white px-1.5 py-1.5 text-xs tabular-nums text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            aria-label="ETA"
          />
          <span className="text-zinc-400">–</span>
          <input
            type="time"
            value={toTimeInput(row.etd)}
            disabled={busy}
            onChange={(e) => {
              const draft = { ...row, etd: fromTimeInput(e.target.value) };
              onRowChange(draft);
              void revalidate(draft);
            }}
            className="w-[6.5rem] rounded-md border border-zinc-200 bg-white px-1.5 py-1.5 text-xs tabular-nums text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            aria-label="ETD"
          />
        </div>
      </td>
      <td className="min-w-[11rem] px-2 py-1.5 align-top [&_.mb-3]:mb-0">
        <FormFieldSelect<number>
          label=""
          name={`bulk_line_${row.id}`}
          value={row.shipping_line_id ?? 0}
          emptyValue={0}
          optionLabel="Buscar naviera…"
          compact
          disabled={busy}
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
                }
              : {
                  ...row,
                  shipping_line_id: null,
                  shipping_line_name: null,
                  vessel_id: null,
                  vessel_name: null,
                  ship: "",
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
          disabled={busy}
          options={STATUS_OPTIONS}
          onChange={(value) => {
            const draft = { ...row, suggested_status: value };
            onRowChange(draft);
            void revalidate(draft);
          }}
        />
      </td>
      <td className="min-w-[12rem] max-w-[16rem] px-2 py-2 align-top">
        {revalidating ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Validando…
          </span>
        ) : row.issues.length > 0 ? (
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
              <X className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
              No
            </span>
            <ul className="space-y-0.5">
              {row.issues.map((issue) => (
                <li
                  key={issue}
                  className="text-[10px] leading-snug text-red-600 dark:text-red-400"
                >
                  {issue}
                </li>
              ))}
            </ul>
            {(row.warnings?.length ?? 0) > 0 ? (
              <ul className="space-y-0.5 pt-0.5">
                {(row.warnings ?? []).map((warning) => (
                  <li
                    key={warning}
                    className="text-[10px] leading-snug text-amber-700 dark:text-amber-400"
                  >
                    {warning}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <Check
                className="h-3.5 w-3.5 shrink-0"
                strokeWidth={2.5}
                aria-hidden
              />
              Sí
            </span>
            {(row.warnings?.length ?? 0) > 0 ? (
              <ul className="space-y-0.5">
                {(row.warnings ?? []).map((warning) => (
                  <li
                    key={warning}
                    className="text-[10px] leading-snug text-amber-700 dark:text-amber-400"
                  >
                    {warning}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </td>
    </tr>
  );
}
