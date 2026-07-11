"use client";

import DefaultButton from "@/components/buttons/DefaultButton";

type FilterActionsProps = {
  onApply: () => void;
  onClear: () => void;
  /** Show clear when any filter differs from defaults. */
  canClear: boolean;
  applyLabel?: string;
  clearLabel?: string;
};

/**
 * Standard FilterSidebar actions: apply + always-visible clear when filters are active.
 */
export default function FilterActions({
  onApply,
  onClear,
  canClear,
  applyLabel = "Aplicar",
  clearLabel = "Limpiar filtros",
}: FilterActionsProps) {
  return (
    <div className="flex flex-col gap-2">
      <DefaultButton type="button" onClick={onApply} className="w-full text-xs">
        {applyLabel}
      </DefaultButton>
      {canClear ? (
        <button
          type="button"
          onClick={onClear}
          className="w-full cursor-pointer rounded-md border border-zinc-200/80 bg-white px-4 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          {clearLabel}
        </button>
      ) : null}
    </div>
  );
}
