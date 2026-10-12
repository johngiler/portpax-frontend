"use client";

import { CalendarDays, CalendarRange, LayoutGrid, Ship } from "lucide-react";
import type { BookingsTabQuery } from "@/lib/viewFilterQuery";

const TABS: {
  id: BookingsTabQuery;
  label: string;
  shortLabel: string;
  icon: typeof CalendarDays;
}[] = [
  { id: "list", label: "Lista", shortLabel: "Lista", icon: CalendarDays },
  {
    id: "calendar",
    label: "Calendario",
    shortLabel: "Calendario",
    icon: CalendarRange,
  },
  {
    id: "availability",
    label: "Disponibilidad/Ocupación puerto",
    shortLabel: "Disponibilidad",
    icon: LayoutGrid,
  },
  {
    id: "proximity",
    label: "Proximidad barco/puerto",
    shortLabel: "Proximidad",
    icon: Ship,
  },
];

type BookingsTabsProps = {
  value: BookingsTabQuery;
  onChange: (tab: BookingsTabQuery) => void;
  /** Proximidad requires applied naviera + barco in filters. */
  proximityEnabled?: boolean;
};

export default function BookingsTabs({
  value,
  onChange,
  proximityEnabled = false,
}: BookingsTabsProps) {
  return (
    <div
      className="mb-6 -mx-1 overflow-x-auto overscroll-x-contain px-1"
      role="presentation"
    >
      <div
        className="flex min-w-min flex-nowrap gap-1 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/50 p-1 dark:bg-zinc-900/40 sm:flex-wrap"
        role="tablist"
        aria-label="Vistas de reservas"
      >
        {TABS.map(({ id, label, shortLabel, icon: Icon }) => {
          const active = value === id;
          const disabled = id === "proximity" && !proximityEnabled;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-disabled={disabled || undefined}
              disabled={disabled}
              title={
                disabled
                  ? "Selecciona naviera y barco en filtros y pulsa Aplicar"
                  : label
              }
              onClick={() => onChange(id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors sm:gap-2 sm:px-3 sm:text-sm ${
                disabled
                  ? "cursor-not-allowed opacity-45"
                  : "cursor-pointer"
              } ${
                active
                  ? "bg-white text-[var(--admin-accent)] shadow-sm dark:bg-zinc-800"
                  : disabled
                    ? "text-zinc-400 dark:text-zinc-600"
                    : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              <span className="whitespace-nowrap sm:hidden">{shortLabel}</span>
              <span className="hidden whitespace-nowrap sm:inline">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
