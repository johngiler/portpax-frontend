"use client";

import { Trash2 } from "lucide-react";
import ConfirmDeleteButton from "@/components/buttons/ConfirmDeleteButton";
import {
  bookingStatusLabel,
  type BookingStatus,
} from "@/types/booking";

type BookingsBulkBarProps = {
  selectedCount: number;
  visibleCount: number;
  allVisibleSelected: boolean;
  busy: boolean;
  commonNextStatuses: BookingStatus[];
  canDelete: boolean;
  /** True when selection has no shared transition (and cannot delete). */
  noSharedActions: boolean;
  onToggleSelectAll: () => void;
  onClear: () => void;
  onDelete: () => void;
  onStatusAction: (status: BookingStatus) => void;
};

export default function BookingsBulkBar({
  selectedCount,
  visibleCount,
  allVisibleSelected,
  busy,
  commonNextStatuses,
  canDelete,
  noSharedActions,
  onToggleSelectAll,
  onClear,
  onDelete,
  onStatusAction,
}: BookingsBulkBarProps) {
  if (visibleCount === 0) return null;

  const deleteLabel =
    selectedCount === 1
      ? "1 reserva cancelada"
      : `${selectedCount} reservas canceladas`;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80">
      <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-300 text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
          checked={allVisibleSelected && visibleCount > 0}
          disabled={visibleCount === 0 || busy}
          onChange={onToggleSelectAll}
          aria-label="Seleccionar todas las reservas visibles"
        />
        Seleccionar visibles ({visibleCount})
      </label>

      {selectedCount > 0 ? (
        <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {selectedCount} seleccionada{selectedCount === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            onClick={onClear}
            disabled={busy}
            className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            Quitar selección
          </button>

          {commonNextStatuses.map((status) => (
            <button
              key={status}
              type="button"
              disabled={busy}
              onClick={() => onStatusAction(status)}
              className={
                status === "c"
                  ? "inline-flex cursor-pointer items-center rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
                  : "inline-flex cursor-pointer items-center rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-semibold text-zinc-800 transition hover:border-[var(--admin-accent)]/40 hover:bg-[var(--admin-accent)]/10 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-100"
              }
            >
              → {bookingStatusLabel(status)}
            </button>
          ))}

          {canDelete ? (
            <ConfirmDeleteButton
              deleteLabel={deleteLabel}
              onDelete={onDelete}
              disabled={busy}
              ariaLabel={`Eliminar ${deleteLabel}`}
              title="Eliminar seleccionadas"
              className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              {busy ? "Procesando…" : "Eliminar"}
            </ConfirmDeleteButton>
          ) : null}

          {noSharedActions ? (
            <span className="w-full text-right text-[11px] text-zinc-500 dark:text-zinc-400 sm:w-auto">
              Sin acción común: alinea estados (p. ej. filtrar) o edita una a una.
              Real no está en lote (requiere PAX por escala).
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
