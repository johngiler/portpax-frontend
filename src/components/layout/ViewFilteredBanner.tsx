"use client";

import { Filter } from "lucide-react";
import { useMainLayoutOptional } from "@/contexts/MainLayoutContext";

type ViewFilteredBannerProps = {
  onClear: () => void;
  message?: string;
};

/** Shown under ViewPageHeader when filters are active and the FilterSidebar is collapsed. */
export default function ViewFilteredBanner({
  onClear,
  message = "Vista filtrada. Los filtros se conservan al cambiar de pantalla y al volver.",
}: ViewFilteredBannerProps) {
  const layout = useMainLayoutOptional();
  const filterOpen = layout?.filterOpen ?? false;
  const isMobile = layout?.isMobile ?? false;

  // Desktop: only when the filter panel is collapsed. Mobile has no panel → always show.
  if (filterOpen && !isMobile) return null;

  return (
    <div
      className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--admin-accent)]/25 bg-[var(--admin-accent)]/8 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200"
      role="status"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <Filter
          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--admin-accent)]"
          strokeWidth={2}
          aria-hidden
        />
        <p className="min-w-0 leading-snug">{message}</p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="shrink-0 cursor-pointer rounded-lg border border-[var(--admin-accent)]/30 bg-white/80 px-3 py-1.5 text-xs font-semibold text-[var(--admin-accent)] transition-colors hover:bg-white dark:bg-zinc-900/60 dark:hover:bg-zinc-900"
      >
        Limpiar filtros
      </button>
    </div>
  );
}
