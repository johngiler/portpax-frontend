"use client";

import { toIsoDate } from "@/lib/bookingDates";
import {
  TIME_FILTER_LABELS,
  getTimeRange,
  type TimeFilterPreset,
  type TimeRange,
} from "@/utils/timeRange";

export type BookingsDatePreset = "all" | TimeFilterPreset;

export const BOOKINGS_DATE_PRESET_LABELS: Record<BookingsDatePreset, string> = {
  all: "Desde hoy",
  ...TIME_FILTER_LABELS,
};

type BookingsDateFiltersProps = {
  datePreset: BookingsDatePreset;
  customDateFrom: string;
  customDateTo: string;
  timeRange: TimeRange;
  /** Availability: show hoy→+3y under "Desde hoy". List: show hoy → … */
  showAllRangeHint?: boolean;
  onDatePresetChange: (preset: BookingsDatePreset) => void;
  onCustomDateFromChange: (value: string) => void;
  onCustomDateToChange: (value: string) => void;
};

export function resolveBookingsDateRange(
  preset: BookingsDatePreset,
  customFrom: string,
  customTo: string,
  refDate?: Date,
): { call_date_from?: string; call_date_to?: string } {
  const now = refDate || new Date();
  const today = toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());

  // Past dates only via custom range.
  if (preset === "custom") {
    const range = getTimeRange("custom", customFrom, customTo, now);
    return { call_date_from: range.date_from, call_date_to: range.date_to };
  }

  if (preset === "all") {
    return { call_date_from: today };
  }

  const range = getTimeRange(preset, customFrom, customTo, now);
  return {
    call_date_from: range.date_from < today ? today : range.date_from,
    call_date_to: range.date_to,
  };
}

export default function BookingsDateFilters({
  datePreset,
  customDateFrom,
  customDateTo,
  timeRange,
  showAllRangeHint = false,
  onDatePresetChange,
  onCustomDateFromChange,
  onCustomDateToChange,
}: BookingsDateFiltersProps) {
  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        Fecha de escala
      </p>
      <div className="flex flex-wrap gap-1.5">
        {(["all", "hoy", "7d", "30d", "temporada"] as const).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onDatePresetChange(preset)}
            className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              datePreset === preset
                ? "border-[var(--admin-accent)] bg-[var(--admin-accent)]/15 text-[var(--admin-accent)]"
                : "border-[var(--admin-border)] bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {BOOKINGS_DATE_PRESET_LABELS[preset]}
          </button>
        ))}
      </div>
      <label className="flex cursor-pointer items-center gap-2 py-1">
        <input
          type="radio"
          name="bookingsDatePreset"
          checked={datePreset === "custom"}
          onChange={() => onDatePresetChange("custom")}
          className="h-4 w-4 cursor-pointer border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
        />
        <span className="text-xs text-zinc-700 dark:text-zinc-300">
          {BOOKINGS_DATE_PRESET_LABELS.custom}
        </span>
      </label>
      {datePreset === "custom" && (
        <div className="space-y-2 pl-6">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Desde
            </label>
            <input
              type="date"
              value={customDateFrom}
              onChange={(e) => onCustomDateFromChange(e.target.value)}
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
              onChange={(e) => onCustomDateToChange(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-[var(--admin-border)] bg-white px-2.5 py-1.5 text-xs dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>
      )}
      {datePreset === "custom" ? null : (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {datePreset === "all" && !showAllRangeHint
            ? `${timeRange.date_from} → …`
            : `${timeRange.date_from} → ${timeRange.date_to}`}
        </p>
      )}
    </div>
  );
}
