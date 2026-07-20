"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import { useConfirm } from "@/contexts/ConfirmContext";
import { buildDeleteConfirmOptions } from "@/lib/confirmDelete";

const btnClass =
  "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors duration-200 hover:bg-black/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100 disabled:opacity-40 disabled:pointer-events-none";

type TableActionButtonsProps = {
  onView?: () => void;
  /** Highlight the view (eye) button when the row accordion is open. */
  viewActive?: boolean;
  onEdit: () => void;
  onDelete?: () => void;
  /** Etiqueta del recurso para el confirm de borrar (ej. "puerto", "barco") */
  deleteLabel?: string;
};

export default function TableActionButtons({
  onView,
  viewActive = false,
  onEdit,
  onDelete,
  deleteLabel = "este elemento",
}: TableActionButtonsProps) {
  const { requestConfirm } = useConfirm();

  function handleDeleteClick() {
    if (onDelete) {
      requestConfirm(buildDeleteConfirmOptions(deleteLabel, onDelete));
    }
  }

  return (
    <div className="flex items-center justify-start gap-1">
      {onView != null && (
        <button
          type="button"
          onClick={onView}
          className={`${btnClass} ${
            viewActive
              ? "bg-[var(--admin-accent)]/10 text-[var(--admin-accent)] hover:bg-[var(--admin-accent)]/15 hover:text-[var(--admin-accent)]"
              : ""
          }`}
          aria-label={viewActive ? "Ocultar detalle" : "Ver"}
          title={viewActive ? "Ocultar detalle" : "Ver"}
          aria-pressed={viewActive}
        >
          <Eye className="h-4 w-4" strokeWidth={1.5} />
        </button>
      )}
      <button
        type="button"
        onClick={onEdit}
        className={btnClass}
        aria-label="Editar"
        title="Editar"
      >
        <Pencil className="h-4 w-4" strokeWidth={1.5} />
      </button>
      {onDelete != null && (
        <button
          type="button"
          onClick={handleDeleteClick}
          className={`${btnClass} hover:text-red-600 dark:hover:text-red-400`}
          aria-label="Eliminar"
          title="Eliminar"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
