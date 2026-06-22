"use client";

import { Search } from "lucide-react";
import { BOOKING_STATUS_FILTER_OPTIONS, type BookingStatus } from "@/types/booking";

type BookingFiltersProps = {
  status: BookingStatus | "";
  search: string;
  onStatusChange: (status: BookingStatus | "") => void;
  onSearchChange: (search: string) => void;
  onSearchApply: () => void;
};

export default function BookingFilters({
  status,
  search,
  onStatusChange,
  onSearchChange,
  onSearchApply,
}: BookingFiltersProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {BOOKING_STATUS_FILTER_OPTIONS.map((option) => {
          const active = status === option.value;
          return (
            <button
              key={option.value || "all"}
              type="button"
              onClick={() => onStatusChange(option.value)}
              className={[
                "cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--admin-accent)] text-white shadow-sm shadow-[var(--admin-accent)]/25"
                  : "border border-zinc-200/80 bg-white text-zinc-600 hover:border-[var(--admin-accent)]/30 hover:text-[var(--admin-accent)] dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300",
              ].join(" ")}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <form
        className="flex w-full max-w-md items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSearchApply();
        }}
      >
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            strokeWidth={2}
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por código, puerto, barco…"
            className="w-full rounded-xl border border-zinc-200/80 bg-white py-2.5 pl-9 pr-3 text-sm text-zinc-900 shadow-sm transition-colors focus:border-[var(--admin-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <button
          type="submit"
          className="cursor-pointer shrink-0 rounded-xl border border-zinc-200/80 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Buscar
        </button>
      </form>
    </div>
  );
}
