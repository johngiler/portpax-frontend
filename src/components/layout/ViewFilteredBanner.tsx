"use client";

import {
  AlertTriangle,
  Anchor,
  Building2,
  CalendarDays,
  CalendarRange,
  Filter,
  LayoutGrid,
  MapPin,
  Scaling,
  Search,
  Ship,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMainLayoutOptional } from "@/contexts/MainLayoutContext";
import type {
  ActiveFilterChip,
  ActiveFilterChipIcon,
} from "@/views/BookingsView/bookingsActiveFilterChips";

const CHIP_ICONS: Record<ActiveFilterChipIcon, LucideIcon> = {
  port: Anchor,
  position: MapPin,
  shipping_line: Building2,
  vessel: Ship,
  status: Tag,
  conflict: AlertTriangle,
  search: Search,
  dates: CalendarDays,
  heat: LayoutGrid,
  density: Ship,
  calendar: CalendarRange,
  lta: Tag,
  tag: Tag,
  size: Scaling,
};

type ViewFilteredBannerProps = {
  onClear: () => void;
  message?: string;
  /** Active filter chips (port, vessel, imported dates, …). */
  chips?: ActiveFilterChip[];
};

/** Shown under ViewPageHeader when filters are active and the FilterSidebar is collapsed. */
export default function ViewFilteredBanner({
  onClear,
  message = "Los filtros se conservan al cambiar de pantalla y al volver.",
  chips = [],
}: ViewFilteredBannerProps) {
  const layout = useMainLayoutOptional();
  const filterOpen = layout?.filterOpen ?? false;
  const isMobile = layout?.isMobile ?? false;
  const setFilterOpen = layout?.setFilterOpen;
  const setSidebarMobileOpen = layout?.setSidebarMobileOpen;

  // Hide while the filter panel / mobile drawer is open.
  if (filterOpen) return null;

  return (
    <div
      className="mb-6 flex flex-col gap-3 rounded-xl border border-[var(--admin-accent)]/25 bg-[var(--admin-accent)]/8 px-3 py-3 text-sm text-zinc-700 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4 dark:text-zinc-200"
      role="status"
    >
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <Filter
          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--admin-accent)]"
          strokeWidth={2}
          aria-hidden
        />
        <div className="min-w-0 space-y-2">
          <p className="leading-snug">
            <span className="font-semibold text-zinc-800 dark:text-zinc-100">
              Vista filtrada
            </span>
            <span className="text-zinc-600 dark:text-zinc-300">
              {" "}
              · {message}
            </span>
          </p>
          {chips.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {chips.map((chip) => {
                const Icon = CHIP_ICONS[chip.icon];
                return (
                  <li
                    key={chip.id}
                    className="inline-flex max-w-full items-center gap-1 rounded-full border border-[var(--admin-accent)]/25 bg-white/90 px-2.5 py-0.5 text-[11px] font-medium text-[var(--admin-accent)] dark:bg-zinc-900/70 dark:text-[var(--admin-accent)]"
                  >
                    <Icon
                      className="h-3 w-3 shrink-0 opacity-90"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <span className="truncate">{chip.label}</span>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 self-stretch sm:self-center">
        {isMobile && setFilterOpen ? (
          <button
            type="button"
            onClick={() => {
              setSidebarMobileOpen?.(false);
              setFilterOpen(true);
            }}
            className="flex-1 cursor-pointer rounded-lg border border-[var(--admin-accent)]/30 bg-white/80 px-3 py-1.5 text-xs font-semibold text-[var(--admin-accent)] transition-colors hover:bg-white sm:flex-none dark:bg-zinc-900/60 dark:hover:bg-zinc-900"
          >
            Editar filtros
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClear}
          className="flex-1 cursor-pointer rounded-lg border border-[var(--admin-accent)]/30 bg-white/80 px-3 py-1.5 text-xs font-semibold text-[var(--admin-accent)] transition-colors hover:bg-white sm:flex-none dark:bg-zinc-900/60 dark:hover:bg-zinc-900"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}
