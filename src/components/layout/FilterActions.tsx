"use client";

import DefaultButton from "@/components/buttons/DefaultButton";
import { useMainLayoutOptional } from "@/contexts/MainLayoutContext";

type FilterActionsProps = {
  onApply: () => void | Promise<void>;
  onClear: () => void;
  /** Show clear when any filter differs from defaults. */
  canClear: boolean;
  /** Enable Aplicar only when draft filters differ from applied. */
  canApply: boolean;
  applyLabel?: string;
  clearLabel?: string;
};

/**
 * Standard FilterSidebar actions: apply + clear when filters are active.
 * On successful apply, collapses the filter sidebar.
 */
export default function FilterActions({
  onApply,
  onClear,
  canClear,
  canApply,
  applyLabel = "Aplicar",
  clearLabel = "Limpiar filtros",
}: FilterActionsProps) {
  const layout = useMainLayoutOptional();

  async function handleApply() {
    if (!canApply) return;
    try {
      await onApply();
      layout?.setFilterOpen(false);
    } catch {
      // Keep sidebar open when apply fails.
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <DefaultButton
        type="button"
        onClick={() => void handleApply()}
        disabled={!canApply}
        className="w-full text-xs disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 disabled:hover:shadow-[0_1px_2px_rgba(15,23,42,0.18)]"
      >
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
