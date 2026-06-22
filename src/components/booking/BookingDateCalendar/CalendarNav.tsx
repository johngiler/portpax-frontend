"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { getBookingYearRange, getMonthOptions } from "@/lib/bookingDates";

const SELECT_CLASS =
  "cursor-pointer rounded-lg border border-zinc-200/80 bg-white px-2.5 py-1.5 text-sm font-semibold text-zinc-800 capitalize shadow-sm transition-colors hover:border-[var(--admin-accent)]/40 focus:border-[var(--admin-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

const NAV_BUTTON_CLASS =
  "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-zinc-200/80 bg-white text-zinc-600 transition-colors hover:border-[var(--admin-accent)]/40 hover:text-[var(--admin-accent)] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300";

type CalendarNavProps = {
  viewYear: number;
  viewMonth: number;
  minIso: string;
  onViewChange: (year: number, monthIndex: number, direction: number) => void;
  onGoToToday: () => void;
};

export default function CalendarNav({
  viewYear,
  viewMonth,
  minIso,
  onViewChange,
  onGoToToday,
}: CalendarNavProps) {
  const monthOptions = getMonthOptions();
  const yearOptions = getBookingYearRange(minIso);
  const minYear = yearOptions[0];
  const maxYear = yearOptions[yearOptions.length - 1];

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    onViewChange(next.getFullYear(), next.getMonth(), delta);
  }

  function shiftYear(delta: number) {
    const nextYear = viewYear + delta;
    if (nextYear < minYear || nextYear > maxYear) return;
    onViewChange(nextYear, viewMonth, delta * 12);
  }

  return (
    <div className="space-y-2 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftYear(-1)}
            disabled={viewYear <= minYear}
            className={NAV_BUTTON_CLASS}
            aria-label="Año anterior"
          >
            <span className="text-xs font-bold tracking-tighter">«</span>
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className={NAV_BUTTON_CLASS}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <label className="sr-only" htmlFor="booking-calendar-month">Mes</label>
          <select
            id="booking-calendar-month"
            value={viewMonth}
            onChange={(event) => {
              const monthIndex = Number(event.target.value);
              const direction = monthIndex > viewMonth ? 1 : monthIndex < viewMonth ? -1 : 0;
              onViewChange(viewYear, monthIndex, direction);
            }}
            className={SELECT_CLASS}
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="booking-calendar-year">Año</label>
          <select
            id="booking-calendar-year"
            value={viewYear}
            onChange={(event) => {
              const year = Number(event.target.value);
              const direction = year > viewYear ? 1 : year < viewYear ? -1 : 0;
              onViewChange(year, viewMonth, direction);
            }}
            className={SELECT_CLASS}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className={NAV_BUTTON_CLASS}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => shiftYear(1)}
            disabled={viewYear >= maxYear}
            className={NAV_BUTTON_CLASS}
            aria-label="Año siguiente"
          >
            <span className="text-xs font-bold tracking-tighter">»</span>
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onGoToToday}
          className="cursor-pointer rounded-full px-3 py-1 text-xs font-semibold text-[var(--admin-accent)] transition-colors hover:bg-[var(--admin-accent)]/10"
        >
          Ir a hoy
        </button>
      </div>
    </div>
  );
}
