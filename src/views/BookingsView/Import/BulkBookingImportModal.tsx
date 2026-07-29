"use client";

import { useMemo, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import Modal from "@/components/ui/Modal";
import ModalFormError from "@/components/ui/ModalFormError";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import {
  createBulkBookingImport,
  type BulkImportPreviewRow,
} from "@/services/bookings/bulkImportService";

type BulkBookingImportModalProps = {
  open: boolean;
  rows: BulkImportPreviewRow[];
  fileName: string;
  onClose: () => void;
  onCreated: (createdCount: number) => void;
};

function formatTime(value: string | null): string {
  if (!value) return "—";
  return value.slice(0, 5);
}

export default function BulkBookingImportModal({
  open,
  rows,
  fileName,
  onClose,
  onCreated,
}: BulkBookingImportModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(rows.filter((r) => r.selected_default).map((r) => r.id));
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCount = selectedIds.size;
  const selectableRows = useMemo(
    () => rows.filter((r) => r.selectable),
    [rows],
  );

  function toggle(id: string, selectable: boolean) {
    if (!selectable) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(select: boolean) {
    if (select) {
      setSelectedIds(new Set(selectableRows.map((r) => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  async function handleCreate() {
    setError(null);
    const payload = rows
      .filter((r) => selectedIds.has(r.id) && r.selectable)
      .map((r) => ({
        id: r.id,
        port_id: r.port_id!,
        shipping_line_id: r.shipping_line_id!,
        vessel_id: r.vessel_id!,
        call_date: r.call_date!,
        eta: r.eta!,
        etd: r.etd!,
      }));

    if (payload.length === 0) {
      setError("Selecciona al menos una reserva válida para crear.");
      return;
    }

    setSaving(true);
    try {
      const result = await createBulkBookingImport(payload);
      if (result.created_count === 0) {
        const detail =
          result.failures[0]?.detail ||
          "No se pudo crear ninguna reserva.";
        setError(detail);
        return;
      }
      if (result.failed_count > 0) {
        setError(
          `Se crearon ${result.created_count}, pero fallaron ${result.failed_count}. Revisa el catálogo o deselecciona filas con error.`,
        );
      }
      onCreated(result.created_count);
    } catch (err) {
      setError(
        getApiErrorMessage(err, "No se pudieron crear las reservas masivas."),
      );
    } finally {
      setSaving(false);
    }
  }

  const allSelectableChecked =
    selectableRows.length > 0 &&
    selectableRows.every((r) => selectedIds.has(r.id));

  return (
    <Modal
      open={open}
      onClose={saving ? () => undefined : onClose}
      title="Carga de reservas masiva"
      panelClassName="max-w-4xl"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="cursor-pointer rounded-md border border-zinc-200/80 bg-white px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <DefaultButton
            type="button"
            disabled={saving || selectedCount === 0}
            onClick={() => void handleCreate()}
            className="disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Creando…" : `Crear reservas (${selectedCount})`}
          </DefaultButton>
        </div>
      }
    >
      <ModalFormError message={error} />

      <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-300">
        Archivo: <span className="font-medium text-zinc-800 dark:text-zinc-100">{fileName}</span>
        {" · "}
        {rows.length} filas · {selectableRows.length} listas para crear ·{" "}
        {selectedCount} seleccionadas
      </p>

      <div className="mb-2 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={allSelectableChecked}
            onChange={(e) => toggleAll(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-zinc-300"
          />
          Seleccionar todas las válidas
        </label>
      </div>

      <div className="max-h-[min(55vh,420px)] overflow-auto rounded-lg border border-[var(--admin-border)]">
        <table className="min-w-full text-left text-xs">
          <thead className="sticky top-0 bg-[var(--admin-surface-muted)] text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-3 py-2 w-10" />
              <th className="px-3 py-2">Barco</th>
              <th className="px-3 py-2">Puerto</th>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">ETA–ETD</th>
              <th className="px-3 py-2">Naviera</th>
              <th className="px-3 py-2">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((row) => {
              const checked = selectedIds.has(row.id);
              return (
                <tr
                  key={row.id}
                  className={
                    row.selectable
                      ? "bg-white dark:bg-zinc-900/60"
                      : "bg-zinc-50/80 dark:bg-zinc-950/40"
                  }
                >
                  <td className="px-3 py-2 align-top">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!row.selectable}
                      onChange={() => toggle(row.id, row.selectable)}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Seleccionar fila ${row.row_number}`}
                    />
                  </td>
                  <td className="px-3 py-2 align-top font-medium text-zinc-800 dark:text-zinc-100">
                    {row.vessel_name || row.ship}
                  </td>
                  <td className="px-3 py-2 align-top text-zinc-600 dark:text-zinc-300">
                    {row.port_name || row.port_raw}
                  </td>
                  <td className="px-3 py-2 align-top text-zinc-600 dark:text-zinc-300">
                    {row.call_date
                      ? formatIsoDateLabel(row.call_date, "short")
                      : "—"}
                  </td>
                  <td className="px-3 py-2 align-top tabular-nums text-zinc-600 dark:text-zinc-300">
                    {formatTime(row.eta)}–{formatTime(row.etd)}
                  </td>
                  <td className="px-3 py-2 align-top text-zinc-600 dark:text-zinc-300">
                    {row.shipping_line_name || "—"}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {row.issues.length === 0 &&
                    (row.warnings?.length ?? 0) === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Lista
                      </span>
                    ) : (
                      <div className="space-y-1">
                        {row.issues.length > 0 ? (
                          <ul className="space-y-0.5 text-red-600 dark:text-red-400">
                            {row.issues.map((issue) => (
                              <li key={issue}>{issue}</li>
                            ))}
                          </ul>
                        ) : null}
                        {(row.warnings?.length ?? 0) > 0 ? (
                          <ul className="space-y-0.5 text-amber-700 dark:text-amber-400">
                            {(row.warnings ?? []).map((warning) => (
                              <li key={warning}>{warning}</li>
                            ))}
                          </ul>
                        ) : null}
                        {row.selectable && (row.warnings?.length ?? 0) > 0 ? (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            Se puede crear (con avisos)
                          </span>
                        ) : null}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
