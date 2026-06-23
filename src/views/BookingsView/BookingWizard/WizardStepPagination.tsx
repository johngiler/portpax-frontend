"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type WizardStepPaginationProps = {
  page: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  label?: string;
};

export default function WizardStepPagination({
  page,
  totalCount,
  pageSize,
  onPageChange,
  label = "elementos",
}: WizardStepPaginationProps) {
  if (totalCount <= pageSize) {
    return (
      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        {totalCount} {label}
      </p>
    );
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Mostrando {from}–{to} de {totalCount} {label}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200/80 bg-white text-zinc-600 transition-colors hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        <span className="min-w-[6.5rem] text-center text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200/80 bg-white text-zinc-600 transition-colors hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
