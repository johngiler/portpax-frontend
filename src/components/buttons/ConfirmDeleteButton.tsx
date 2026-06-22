"use client";

import { Trash2 } from "lucide-react";
import { useConfirm } from "@/contexts/ConfirmContext";
import { buildDeleteConfirmOptions } from "@/lib/confirmDelete";

type ConfirmDeleteButtonProps = {
  deleteLabel: string;
  onDelete: () => void;
  className?: string;
  ariaLabel?: string;
  title?: string;
  disabled?: boolean;
  children?: React.ReactNode;
};

export default function ConfirmDeleteButton({
  deleteLabel,
  onDelete,
  className,
  ariaLabel = "Eliminar",
  title = "Eliminar",
  disabled,
  children,
}: ConfirmDeleteButtonProps) {
  const { requestConfirm } = useConfirm();

  function handleClick() {
    requestConfirm(buildDeleteConfirmOptions(deleteLabel, onDelete));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel}
      title={title}
    >
      {children ?? <Trash2 className="h-4 w-4" />}
    </button>
  );
}
