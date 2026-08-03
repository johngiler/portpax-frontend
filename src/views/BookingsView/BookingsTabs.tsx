"use client";

import { CalendarDays, CalendarRange, LayoutGrid } from "lucide-react";
import type { BookingsTabQuery } from "@/lib/viewFilterQuery";

const TABS: {
  id: BookingsTabQuery;
  label: string;
  icon: typeof CalendarDays;
}[] = [
  { id: "list", label: "Lista", icon: CalendarDays },
  { id: "calendar", label: "Calendario", icon: CalendarRange },
  { id: "availability", label: "Disponibilidad puerto", icon: LayoutGrid },
];

type BookingsTabsProps = {
  value: BookingsTabQuery;
  onChange: (tab: BookingsTabQuery) => void;
};

export default function BookingsTabs({ value, onChange }: BookingsTabsProps) {
  return (
    <div
      className="mb-6 flex flex-wrap gap-1 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/50 p-1 dark:bg-zinc-900/40"
      role="tablist"
      aria-label="Vistas de reservas"
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-white text-[var(--admin-accent)] shadow-sm dark:bg-zinc-800"
                : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
