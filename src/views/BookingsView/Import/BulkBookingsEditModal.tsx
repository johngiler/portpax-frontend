"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import { FormFieldSelect } from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import ModalFormError from "@/components/ui/ModalFormError";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { fromTimeInputValue } from "@/lib/bookingDisplay";
import { useNavigationLock } from "@/lib/useNavigationLock";
import { fetchPorts } from "@/services/catalogs/portService";
import { fetchShippingLines } from "@/services/catalogs/shippingLineService";
import { fetchVessels } from "@/services/catalogs/vesselService";
import {
  applyBulkEdit,
  previewBulkEdit,
  revalidateBulkEditRow,
  type BulkEditRow,
} from "@/services/bookings/bulkEditService";
import { BOOKING_STATUS_LABELS, type BookingStatus } from "@/types/booking";
import BulkImportRowIssuesCell from "./BulkImportRowIssuesCell";
import BulkImportRowPositionSelect from "./BulkImportRowPositionSelect";
import type { BulkImportPreviewRow } from "@/services/bookings/bulkImportService";

type BulkBookingsEditModalProps = {
  open: boolean;
  bookingIds: number[];
  onClose: () => void;
  onSaved: (result: { updatedCount: number; failedCount: number }) => void;
};

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "nr", label: BOOKING_STATUS_LABELS.nr },
  { value: "h", label: BOOKING_STATUS_LABELS.h },
  { value: "co", label: BOOKING_STATUS_LABELS.co },
  { value: "cl", label: BOOKING_STATUS_LABELS.cl },
  { value: "lta", label: BOOKING_STATUS_LABELS.lta },
  { value: "ltd", label: BOOKING_STATUS_LABELS.ltd },
];

function toPositionRow(row: BulkEditRow): BulkImportPreviewRow {
  return {
    id: String(row.booking_id),
    row_number: row.booking_id,
    ship: row.vessel_name || "",
    port_raw: row.port_name || "",
    vendor_name: row.shipping_line_name || "",
    call_type: "",
    call_date: row.call_date,
    eta: row.eta,
    etd: row.etd,
    port_id: row.port_id,
    port_name: row.port_name ?? null,
    port_code: row.port_code ?? null,
    vessel_id: row.vessel_id,
    vessel_name: row.vessel_name ?? null,
    shipping_line_id: row.shipping_line_id,
    shipping_line_name: row.shipping_line_name ?? null,
    suggested_status:
      row.status === "co" ||
      row.status === "cl" ||
      row.status === "lta" ||
      row.status === "ltd" ||
      row.status === "h" ||
      row.status === "nr"
        ? (row.status as BulkImportPreviewRow["suggested_status"])
        : "h",
    position_id: row.position_id,
    position_code: row.position_code ?? null,
    issues: (row.blocking_issues ?? []).map((i) => i.message),
    warnings: (row.warnings ?? []).map((i) => i.message),
    selectable: row.selectable,
    selected_default: row.selectable,
  };
}

function EditRow({
  row,
  checked,
  disabled,
  onToggle,
  onRowChange,
}: {
  row: BulkEditRow;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onRowChange: (next: BulkEditRow) => void;
}) {
  const [revalidating, setRevalidating] = useState(false);
  const [occupancyReloadKey, setOccupancyReloadKey] = useState(0);
  const reqIdRef = useRef(0);
  const busy = disabled || revalidating;

  const revalidate = useCallback(
    async (draft: BulkEditRow) => {
      const reqId = ++reqIdRef.current;
      setRevalidating(true);
      try {
        const next = await revalidateBulkEditRow(draft);
        if (reqId !== reqIdRef.current) return;
        onRowChange({
          ...draft,
          ...next,
          port_name: next.port_name ?? draft.port_name,
          port_code: next.port_code ?? draft.port_code,
          vessel_name: next.vessel_name ?? draft.vessel_name,
          shipping_line_name:
            next.shipping_line_name ?? draft.shipping_line_name,
          shipping_line_group:
            next.shipping_line_group ?? draft.shipping_line_group,
          position_code: next.position_code ?? draft.position_code,
        });
        setOccupancyReloadKey((k) => k + 1);
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
    const res = await fetchPorts({ search: input, pageSize: 30 });
    return res.results
      .filter((p) => p.is_active)
      .map((p) => ({ value: p.id, label: p.name, logoUrl: p.logo }));
  }, []);

  const loadLineOptions = useCallback(
    async (input: string) => {
      const res = await fetchShippingLines({
        search: input,
        pageSize: 30,
        group: row.shipping_line_group ?? undefined,
      });
      return res.results
        .filter((l) => l.is_active)
        .map((l) => ({ value: l.id, label: l.name, logoUrl: l.logo }));
    },
    [row.shipping_line_group],
  );

  const loadVesselOptions = useCallback(
    async (input: string) => {
      const res = await fetchVessels({
        search: input,
        shipping_line: row.shipping_line_id,
        pageSize: 30,
      });
      return res.results
        .filter((v) => v.is_active)
        .map((v) => ({ value: v.id, label: v.name, logoUrl: v.logo }));
    },
    [row.shipping_line_id],
  );

  const statusValue = (
    STATUS_OPTIONS.some((o) => o.value === row.status) ? row.status : "h"
  ) as BookingStatus;

  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800">
      <td className="px-2 py-2 align-top">
        <input
          type="checkbox"
          checked={checked}
          disabled={!row.selectable || busy}
          onChange={onToggle}
          className="mt-2 h-4 w-4 rounded border-zinc-300"
        />
      </td>
      <td className="min-w-[10rem] px-2 py-1.5 align-top [&_.mb-3]:mb-0">
        <FormFieldSelect<number>
          label=""
          name={`edit_vessel_${row.booking_id}`}
          value={row.vessel_id}
          compact
          disabled={busy || !row.shipping_line_id}
          loadOptions={loadVesselOptions}
          logoKind="vessel"
          options={[
            {
              value: row.vessel_id,
              label: row.vessel_name || "Barco",
            },
          ]}
          onChange={(id, option) => {
            const draft = {
              ...row,
              vessel_id: id,
              vessel_name: option?.label ?? row.vessel_name,
              position_id: null,
              position_code: null,
            };
            onRowChange(draft);
            void revalidate(draft);
          }}
        />
      </td>
      <td className="min-w-[9rem] px-2 py-1.5 align-top [&_.mb-3]:mb-0">
        <FormFieldSelect<number>
          label=""
          name={`edit_port_${row.booking_id}`}
          value={row.port_id}
          compact
          disabled={busy}
          loadOptions={loadPortOptions}
          logoKind="port"
          options={[
            { value: row.port_id, label: row.port_name || "Puerto" },
          ]}
          onChange={(id, option) => {
            const draft = {
              ...row,
              port_id: id,
              port_name: option?.label ?? row.port_name,
              position_id: null,
              position_code: null,
            };
            onRowChange(draft);
            void revalidate(draft);
          }}
        />
      </td>
      <td className="px-2 py-1.5 align-top">
        <input
          type="date"
          value={row.call_date}
          disabled={busy}
          onChange={(e) => {
            const draft = { ...row, call_date: e.target.value };
            onRowChange(draft);
            void revalidate(draft);
          }}
          className="w-[9.5rem] rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
        />
      </td>
      <td className="px-2 py-1.5 align-top">
        <div className="flex items-center gap-1">
          <input
            type="text"
            inputMode="numeric"
            placeholder="08:00"
            value={(row.eta ?? "").slice(0, 5)}
            disabled={busy}
            onChange={(e) => onRowChange({ ...row, eta: e.target.value || null })}
            onBlur={() => {
              const draft = {
                ...row,
                eta: fromTimeInputValue(row.eta ?? ""),
              };
              onRowChange(draft);
              void revalidate(draft);
            }}
            className="w-[4.25rem] rounded-md border border-zinc-200 bg-white px-1 py-1.5 text-center text-xs tabular-nums dark:border-zinc-700 dark:bg-zinc-900"
          />
          <span className="text-zinc-400">–</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="17:00"
            value={(row.etd ?? "").slice(0, 5)}
            disabled={busy}
            onChange={(e) => onRowChange({ ...row, etd: e.target.value || null })}
            onBlur={() => {
              const draft = {
                ...row,
                etd: fromTimeInputValue(row.etd ?? ""),
              };
              onRowChange(draft);
              void revalidate(draft);
            }}
            className="w-[4.25rem] rounded-md border border-zinc-200 bg-white px-1 py-1.5 text-center text-xs tabular-nums dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </td>
      <td className="min-w-[8.5rem] px-2 py-1.5 align-top [&_.mb-3]:mb-0">
        <BulkImportRowPositionSelect
          row={toPositionRow(row)}
          disabled={busy}
          reloadKey={occupancyReloadKey}
          onChange={(preview) => {
            onRowChange({
              ...row,
              position_id: preview.position_id ?? null,
              position_code: preview.position_code ?? null,
            });
          }}
          onCommit={(preview) => {
            const draft = {
              ...row,
              position_id: preview.position_id ?? null,
              position_code: preview.position_code ?? null,
            };
            onRowChange(draft);
            void revalidate(draft);
          }}
        />
      </td>
      <td className="min-w-[11rem] px-2 py-1.5 align-top [&_.mb-3]:mb-0">
        <FormFieldSelect<number>
          label=""
          name={`edit_line_${row.booking_id}`}
          value={row.shipping_line_id}
          compact
          disabled={busy}
          loadOptions={loadLineOptions}
          logoKind="shipping_line"
          options={[
            {
              value: row.shipping_line_id,
              label: row.shipping_line_name || "Naviera",
            },
          ]}
          onChange={(id, option) => {
            const draft = {
              ...row,
              shipping_line_id: id,
              shipping_line_name: option?.label ?? row.shipping_line_name,
              vessel_id: 0,
              vessel_name: undefined,
              position_id: null,
              position_code: null,
            };
            onRowChange(draft);
            void revalidate(draft);
          }}
        />
      </td>
      <td className="min-w-[10rem] px-2 py-1.5 align-top [&_.mb-3]:mb-0">
        <FormFieldSelect<BookingStatus>
          label=""
          name={`edit_status_${row.booking_id}`}
          value={statusValue}
          compact
          disabled={busy}
          options={STATUS_OPTIONS}
          onChange={(value) => {
            const draft = { ...row, status: value };
            onRowChange(draft);
            void revalidate(draft);
          }}
        />
      </td>
      <td className="min-w-[7rem] px-2 py-2 align-top">
        <p className="mb-1 truncate text-[10px] font-medium text-zinc-400">
          {row.booking_code}
        </p>
        <BulkImportRowIssuesCell
          row={toPositionRow(row)}
          revalidating={revalidating}
          modalTitle={`Avisos · ${row.booking_code}`}
          onRefreshAvisos={() => revalidate(row)}
        />
      </td>
    </tr>
  );
}

export default function BulkBookingsEditModal({
  open,
  bookingIds,
  onClose,
  onSaved,
}: BulkBookingsEditModalProps) {
  const [rows, setRows] = useState<BulkEditRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || bookingIds.length === 0) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void previewBulkEdit(bookingIds)
      .then((res) => {
        if (cancelled) return;
        setRows(res.rows);
        setSelectedIds(
          new Set(res.rows.filter((r) => r.selectable).map((r) => r.booking_id)),
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          getApiErrorMessage(err, "No se pudieron cargar las reservas."),
        );
        setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, bookingIds]);

  useNavigationLock(
    open && saving,
    "Se están guardando los cambios. No cambies de sección ni cierres la ventana.",
  );

  const selectableRows = useMemo(
    () => rows.filter((r) => r.selectable),
    [rows],
  );
  const selectedCount = selectedIds.size;

  function updateRow(next: BulkEditRow) {
    setRows((prev) => {
      setSelectedIds((selected) => {
        const copy = new Set(selected);
        if (!next.selectable) copy.delete(next.booking_id);
        return copy;
      });
      return prev.map((r) => (r.booking_id === next.booking_id ? next : r));
    });
  }

  async function handleSave() {
    setError(null);
    const selected = rows.filter(
      (r) => selectedIds.has(r.booking_id) && r.selectable,
    );
    if (selected.length === 0) {
      setError("Selecciona al menos una reserva válida para guardar.");
      return;
    }
    setSaving(true);
    try {
      const result = await applyBulkEdit(selected);
      onSaved({
        updatedCount: result.updated_count,
        failedCount: result.failed_count,
      });
      if (result.failed_count > 0) {
        setError(
          `${result.updated_count} guardadas; ${result.failed_count} fallaron.`,
        );
        const failedIds = new Set(result.failed.map((f) => f.booking_id));
        setRows((prev) => prev.filter((r) => failedIds.has(r.booking_id)));
        setSelectedIds(failedIds);
      } else {
        onClose();
      }
    } catch (err) {
      setError(
        getApiErrorMessage(err, "No se pudieron guardar los cambios masivos."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!saving) onClose();
      }}
      title="Modificación masiva de reservas"
      panelClassName="w-[min(98vw,120rem)] max-w-[min(98vw,120rem)]"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
          >
            Cancelar
          </button>
          <DefaultButton
            type="button"
            disabled={saving || loading || selectedCount === 0}
            onClick={() => void handleSave()}
          >
            {saving
              ? "Guardando…"
              : `Guardar cambios (${selectedCount})`}
          </DefaultButton>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-zinc-500">
          {loading
            ? "Cargando…"
            : `${rows.length} reservas · ${selectedCount} seleccionadas. Los avisos no bloquean el guardado salvo cambio de grupo naviera u otros errores de identidad.`}
        </p>
        <ModalFormError message={error} />
        <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600">
          <input
            type="checkbox"
            checked={
              selectableRows.length > 0 &&
              selectableRows.every((r) => selectedIds.has(r.booking_id))
            }
            disabled={saving || loading || selectableRows.length === 0}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedIds(
                  new Set(selectableRows.map((r) => r.booking_id)),
                );
              } else {
                setSelectedIds(new Set());
              }
            }}
          />
          Seleccionar todas las válidas
        </label>
        <div className="max-h-[min(60vh,32rem)] overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full text-left text-xs">
            <thead className="sticky top-0 bg-zinc-50 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:bg-zinc-900">
              <tr>
                <th className="px-2 py-2" />
                <th className="px-2 py-2">Barco</th>
                <th className="px-2 py-2">Puerto</th>
                <th className="px-2 py-2">Fecha</th>
                <th className="px-2 py-2">ETA—ETD</th>
                <th className="px-2 py-2">Posición</th>
                <th className="px-2 py-2">Naviera</th>
                <th className="px-2 py-2">Estado</th>
                <th className="px-2 py-2">Avisos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <EditRow
                  key={row.booking_id}
                  row={row}
                  checked={selectedIds.has(row.booking_id)}
                  disabled={saving}
                  onToggle={() => {
                    if (!row.selectable) return;
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(row.booking_id)) next.delete(row.booking_id);
                      else next.add(row.booking_id);
                      return next;
                    });
                  }}
                  onRowChange={updateRow}
                />
              ))}
            </tbody>
          </table>
          {!loading && rows.length === 0 ? (
            <p className="px-4 py-6 text-sm text-zinc-500">
              No hay reservas editables en la selección.
            </p>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
