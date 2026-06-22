"use client";

import { useMemo, useState } from "react";
import {
  getCalendarGrid,
  parseIsoDate,
  toIsoDate,
  type CalendarCell,
} from "@/lib/bookingDates";
import CalendarGrid from "./CalendarGrid";
import CalendarNav from "./CalendarNav";
import SelectedDatesList from "./SelectedDatesList";

type BookingDateCalendarProps = {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
  minDate?: string;
};

function todayIso(): string {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

export default function BookingDateCalendar({
  selectedDates,
  onChange,
  minDate,
}: BookingDateCalendarProps) {
  const today = todayIso();
  const min = minDate ?? today;
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [direction, setDirection] = useState(0);

  const weeks = useMemo(
    () => getCalendarGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates]);

  function setView(year: number, monthIndex: number, navDirection: number) {
    setDirection(navDirection);
    setViewYear(year);
    setViewMonth(monthIndex);
  }

  function goToToday() {
    const now = new Date();
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    const delta = (year - viewYear) * 12 + (monthIndex - viewMonth);
    setView(year, monthIndex, delta >= 0 ? 1 : -1);
  }

  function toggleDate(cell: CalendarCell) {
    if (cell.iso < min) return;

    if (!cell.isCurrentMonth) {
      const delta =
        cell.year > viewYear || (cell.year === viewYear && cell.monthIndex > viewMonth) ? 1 : -1;
      setView(cell.year, cell.monthIndex, delta);
    }

    if (selectedSet.has(cell.iso)) {
      onChange(selectedDates.filter((date) => date !== cell.iso));
    } else {
      onChange([...selectedDates, cell.iso].sort());
    }
  }

  function jumpToFirstSelected() {
    if (selectedDates.length === 0) return;
    const first = selectedDates[0];
    const { year, monthIndex } = parseIsoDate(first);
    const delta = (year - viewYear) * 12 + (monthIndex - viewMonth);
    setView(year, monthIndex, delta >= 0 ? 1 : -1);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-white via-[var(--admin-accent)]/[0.04] to-zinc-50 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-800">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--admin-accent)]">
            Calendario
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Marca uno o varios días · usa los selectores para cambiar mes y año
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedDates.length > 0 ? (
            <button
              type="button"
              onClick={jumpToFirstSelected}
              className="cursor-pointer rounded-full border border-zinc-200/80 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-[var(--admin-accent)]/30 hover:text-[var(--admin-accent)] dark:border-zinc-700 dark:text-zinc-300"
            >
              Ver selección
            </button>
          ) : null}
          <span className="rounded-full bg-[var(--admin-accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--admin-accent)]">
            {selectedDates.length} fecha{selectedDates.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <CalendarNav
        viewYear={viewYear}
        viewMonth={viewMonth}
        minIso={min}
        onViewChange={setView}
        onGoToToday={goToToday}
      />

      <CalendarGrid
        weeks={weeks}
        viewYear={viewYear}
        viewMonth={viewMonth}
        direction={direction}
        todayIso={today}
        minIso={min}
        selectedSet={selectedSet}
        onDayClick={toggleDate}
      />

      <SelectedDatesList selectedDates={selectedDates} onChange={onChange} />
    </div>
  );
}
