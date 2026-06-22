"use client";

import { Anchor, Plus } from "lucide-react";

const CREATE_LINK_CLASS =
  "btn-primary-gradient inline-flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.18)] transition-all hover:brightness-105 hover:shadow-[0_8px_22px_-14px_rgba(52,120,181,0.7)]";

type ShippingLinesEmptyStateProps = {
  filtered: boolean;
  onCreate?: () => void;
};

export default function ShippingLinesEmptyState({
  filtered,
  onCreate,
}: ShippingLinesEmptyStateProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-white via-[var(--admin-accent)]/[0.05] to-zinc-50 px-6 py-12 text-center shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
        <Anchor className="h-8 w-8" strokeWidth={1.5} aria-hidden />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {filtered ? "Sin navieras con estos filtros" : "Aún no hay navieras"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
        {filtered
          ? "Ajusta la búsqueda o registra una nueva marca operativa."
          : "Registra marcas operativas y su grupo corporativo para asociar barcos."}
      </p>
      {!filtered && onCreate ? (
        <div className="mt-6 flex justify-center">
          <button type="button" onClick={onCreate} className={CREATE_LINK_CLASS}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Nueva naviera
          </button>
        </div>
      ) : null}
    </div>
  );
}
