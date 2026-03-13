"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import { useConfirm } from "@/contexts/ConfirmContext";

const btnClass =
  "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors duration-200 hover:bg-black/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100 disabled:opacity-40 disabled:pointer-events-none";

type TableActionButtonsProps = {
  onView?: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  /** Etiqueta del recurso para el confirm de borrar (ej. "puerto", "barco") */
  deleteLabel?: string;
};

export default function TableActionButtons({
  onView,
  onEdit,
  onDelete,
  deleteLabel = "este elemento",
}: TableActionButtonsProps) {
  const { requestConfirm } = useConfirm();

  function handleDeleteClick() {
    if (onDelete) {
      requestConfirm({
        title: "Confirmar eliminación",
        message: `¿Eliminar ${deleteLabel}? Esta acción no se puede deshacer.`,
        confirmLabel: "Eliminar",
        danger: true,
        onConfirm: onDelete,
      });
    }
  }

  return (
    <div className="flex items-center justify-center gap-1">
      {onView != null && (
        <button
          type="button"
          onClick={onView}
          className={btnClass}
          aria-label="Ver"
          title="Ver"
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
