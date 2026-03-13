"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const DEFAULT_PAGE_SIZE = 20;

export type TablePaginationProps = {
  page: number;
  totalCount: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  /** Texto para el recurso (ej. "puertos", "navieras") */
  label?: string;
};

export default function TablePagination({
  page,
  totalCount,
  pageSize = DEFAULT_PAGE_SIZE,
  onPageChange,
  label = "elementos",
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--admin-border)]/50 bg-[var(--admin-surface-muted)]/50 px-4 py-3">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Mostrando {from}–{to} de {totalCount} {label}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-zinc-600 transition-colors hover:bg-[var(--admin-surface-muted)] disabled:pointer-events-none disabled:opacity-40 dark:text-zinc-400"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        <span className="min-w-[7rem] text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-zinc-600 transition-colors hover:bg-[var(--admin-surface-muted)] disabled:pointer-events-none disabled:opacity-40 dark:text-zinc-400"
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
