"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DefaultButton from "@/components/buttons/DefaultButton";
import Modal from "@/components/ui/Modal";
import ModalFormError from "@/components/ui/ModalFormError";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { useNavigationLock } from "@/lib/useNavigationLock";
import {
  createBulkBookingImport,
  revalidateBulkImportRow,
  type BulkImportPreviewRow,
} from "@/services/bookings/bulkImportService";
import { applyLtaSpaceClaim } from "./applyLtaSpaceClaim";
import BulkImportEditableRow from "./BulkImportEditableRow";

type BulkBookingImportModalProps = {
  open: boolean;
  rows: BulkImportPreviewRow[];
  fileName: string;
  importSource?: "file" | "paste";
  onClose: () => void;
  onCreated: (result: {
    batchId: number;
    createdCount: number;
    failedCount: number;
  }) => void;
};

export default function BulkBookingImportModal({
  open,
  rows: initialRows,
  fileName,
  importSource = "file",
  onClose,
  onCreated,
}: BulkBookingImportModalProps) {
  const [draftRows, setDraftRows] = useState<BulkImportPreviewRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [claimingAllLta, setClaimingAllLta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const claimAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const normalized = initialRows.map((r) => ({
      ...r,
      suggested_status:
        r.suggested_status === "co" ||
        r.suggested_status === "cl" ||
        r.suggested_status === "lta" ||
        r.suggested_status === "ltd" ||
        r.suggested_status === "h"
          ? r.suggested_status
          : "h",
    })) as BulkImportPreviewRow[];
    setDraftRows(normalized);
    setSelectedIds(
      new Set(
        normalized
          .filter((r) => r.selected_default && r.selectable)
          .map((r) => r.id),
      ),
    );
    setError(null);
  }, [open, initialRows]);

  useNavigationLock(
    open && saving,
    "Se están creando las reservas. No cambies de sección, no modifiques la URL ni cierres la ventana del navegador.",
  );

  const selectedCount = selectedIds.size;
  const selectableRows = useMemo(
    () => draftRows.filter((r) => r.selectable),
    [draftRows],
  );
  const claimableLtaRows = useMemo(
    () => draftRows.filter((r) => Boolean(r.lta_space_candidate)),
    [draftRows],
  );
  const allLtaClaimed =
    claimableLtaRows.length > 0 &&
    claimableLtaRows.every((r) => Boolean(r.claim_lta_space));
  const someLtaClaimed = claimableLtaRows.some((r) => Boolean(r.claim_lta_space));

  useEffect(() => {
    if (claimAllRef.current) {
      claimAllRef.current.indeterminate =
        someLtaClaimed && !allLtaClaimed;
    }
  }, [someLtaClaimed, allLtaClaimed]);

  function updateRow(next: BulkImportPreviewRow) {
    setDraftRows((prev) => {
      const was = prev.find((r) => r.id === next.id);
      setSelectedIds((selected) => {
        const copy = new Set(selected);
        if (!next.selectable) copy.delete(next.id);
        else if (was && !was.selectable && next.selectable) copy.add(next.id);
        return copy;
      });
      return prev.map((r) => (r.id === next.id ? next : r));
    });
  }

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

  async function toggleAllLtaClaims(claim: boolean) {
    if (claimableLtaRows.length === 0 || saving || claimingAllLta) return;
    const nextRows = draftRows.map((row) =>
      row.lta_space_candidate ? applyLtaSpaceClaim(row, claim) : row,
    );
    setDraftRows(nextRows);
    setClaimingAllLta(true);
    setError(null);
    try {
      const targets = nextRows.filter((r) => r.lta_space_candidate);
      const settled = await Promise.all(
        targets.map(async (draft) => {
          try {
            const next = await revalidateBulkImportRow(draft);
            return {
              id: draft.id,
              row: {
                ...next,
                id: draft.id,
                suggested_status:
                  next.suggested_status === "co" ||
                  next.suggested_status === "cl" ||
                  next.suggested_status === "lta" ||
                  next.suggested_status === "ltd" ||
                  next.suggested_status === "h"
                    ? next.suggested_status
                    : draft.suggested_status,
                position_occupancy_hint: draft.position_occupancy_hint ?? null,
                position_occupant: draft.position_occupant ?? null,
              } as BulkImportPreviewRow,
            };
          } catch {
            return { id: draft.id, row: draft };
          }
        }),
      );
      const byId = new Map(settled.map((item) => [item.id, item.row]));
      setDraftRows((prev) =>
        prev.map((row) => byId.get(row.id) ?? row),
      );
    } finally {
      setClaimingAllLta(false);
    }
  }

  async function handleCreate() {
    setError(null);
    const selectedRows = draftRows.filter(
      (r) => selectedIds.has(r.id) && r.selectable,
    );
    const deferredRows = draftRows.filter(
      (r) => !selectedIds.has(r.id) || !r.selectable,
    );

    if (selectedRows.length === 0) {
      setError("Selecciona al menos una reserva válida para crear.");
      return;
    }

    setSaving(true);
    try {
      const result = await createBulkBookingImport(selectedRows, {
        source: importSource,
        label: fileName,
        deferredRows,
      });
      onCreated({
        batchId: result.batch_id,
        createdCount: result.created_count,
        failedCount: result.failed_count,
      });
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
      onClose={saving || claimingAllLta ? () => undefined : onClose}
      closeable={!saving && !claimingAllLta}
      title="Carga de reservas masiva"
      panelClassName="max-w-[min(96vw,92rem)]"
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

      {saving ? (
        <p className="mb-3 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
          Creando reservas… No cambies de sección, no modifiques la URL ni
          cierres la ventana del navegador.
        </p>
      ) : null}

      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm text-zinc-600 dark:text-zinc-300">
          Archivo:{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-100">
            {fileName}
          </span>
          {" · "}
          {draftRows.length} filas · {selectableRows.length} listas para crear ·{" "}
          {selectedCount} seleccionadas
        </p>
      </div>

      <p className="mb-3 text-[11px] text-zinc-500 dark:text-zinc-400">
        Por defecto En evaluación (Hold). Puedes cambiar estado (sin Cancelada),
        barco, puerto, naviera, fecha y ETA/ETD antes de crear.
      </p>

      <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={allSelectableChecked}
            disabled={saving || claimingAllLta}
            onChange={(e) => toggleAll(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
          />
          Seleccionar todas las válidas
        </label>
        {claimableLtaRows.length > 0 ? (
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              ref={claimAllRef}
              type="checkbox"
              checked={allLtaClaimed}
              disabled={saving || claimingAllLta}
              onChange={(e) => void toggleAllLtaClaims(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
            />
            {claimingAllLta
              ? "Actualizando reclamos LTA…"
              : `Reclamar todos los espacios LTA (${claimableLtaRows.length})`}
          </label>
        ) : null}
      </div>

      <div className="max-h-[min(60vh,520px)] overflow-auto rounded-lg border border-[var(--admin-border)]">
        <table className="min-w-full text-left text-xs">
          <thead className="sticky top-0 z-[1] bg-[var(--admin-surface-muted)] text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="w-10 px-2 py-2" />
              <th className="px-2 py-2">Barco</th>
              <th className="px-2 py-2">Puerto</th>
              <th className="px-2 py-2">Fecha</th>
              <th className="px-2 py-2">ETA–ETD</th>
              <th className="px-2 py-2">Posición</th>
              <th className="px-2 py-2">Naviera</th>
              <th className="px-2 py-2">Estado</th>
              <th
                className="px-2 py-2"
                title="Reclamar espacio LTA reservado para esta naviera"
              >
                <span className="inline-flex items-center gap-1.5">
                  {claimableLtaRows.length > 0 ? (
                    <input
                      type="checkbox"
                      checked={allLtaClaimed}
                      disabled={saving || claimingAllLta}
                      onChange={(e) => void toggleAllLtaClaims(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Reclamar todos los espacios LTA"
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = someLtaClaimed && !allLtaClaimed;
                        }
                      }}
                    />
                  ) : null}
                  Reclamar espacio LTA
                </span>
              </th>
              <th className="px-2 py-2">¿Correcto?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {draftRows.map((row) => (
              <BulkImportEditableRow
                key={row.id}
                row={row}
                disabled={saving || claimingAllLta}
                checked={selectedIds.has(row.id)}
                onToggle={() => toggle(row.id, row.selectable)}
                onRowChange={updateRow}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
