"use client";

import {
  TIME_FILTER_LABELS,
  type TimeFilterPreset,
  type TimeRange,
} from "@/utils/timeRange";

type TimeRangeFiltersProps = {
  timeFilter: TimeFilterPreset;
  setTimeFilter: (v: TimeFilterPreset) => void;
  customDateFrom: string;
  setCustomDateFrom: (v: string) => void;
  customDateTo: string;
  setCustomDateTo: (v: string) => void;
  timeRange: TimeRange;
  canClear?: boolean;
  onClear?: () => void;
};

export default function TimeRangeFilters({
  timeFilter,
  setTimeFilter,
  customDateFrom,
  setCustomDateFrom,
  customDateTo,
  setCustomDateTo,
  timeRange,
  canClear = false,
  onClear,
}: TimeRangeFiltersProps) {
  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        Período
      </p>
      <div className="flex flex-wrap gap-1.5">
        {(["hoy", "7d", "30d", "temporada"] as const).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setTimeFilter(preset)}
            className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              timeFilter === preset
                ? "border-[var(--admin-accent)] bg-[var(--admin-accent)]/15 text-[var(--admin-accent)]"
                : "border-[var(--admin-border)] bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {TIME_FILTER_LABELS[preset]}
          </button>
        ))}
      </div>
      <label className="flex cursor-pointer items-center gap-2 py-1">
        <input
          type="radio"
          name="timeFilter"
          checked={timeFilter === "custom"}
          onChange={() => setTimeFilter("custom")}
          className="h-4 w-4 cursor-pointer border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
        />
        <span className="text-xs text-zinc-700 dark:text-zinc-300">
          {TIME_FILTER_LABELS.custom}
        </span>
      </label>
      {timeFilter === "custom" && (
        <div className="space-y-2 pl-6">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Desde
            </label>
            <input
              type="date"
              value={customDateFrom}
              onChange={(e) => setCustomDateFrom(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-[var(--admin-border)] bg-white px-2.5 py-1.5 text-xs dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Hasta
            </label>
            <input
              type="date"
              value={customDateTo}
              onChange={(e) => setCustomDateTo(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-[var(--admin-border)] bg-white px-2.5 py-1.5 text-xs dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>
      )}
      {timeFilter !== "custom" && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {timeRange.date_from} → {timeRange.date_to}
        </p>
      )}
      {canClear && onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="w-full cursor-pointer rounded-md border border-zinc-200/80 bg-white px-4 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );
}
