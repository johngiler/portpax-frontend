"use client";

import { useMemo, useState } from "react";
import {
  getCalendarGrid,
  parseIsoDate,
  toIsoDate,
  type CalendarCell,
} from "@/lib/bookingDates";
import CalendarDayAccordion from "./CalendarDayAccordion";
import CalendarGrid from "./CalendarGrid";
import CalendarNav from "./CalendarNav";
import SelectedDatesList from "./SelectedDatesList";
import type { CalendarDayBooking } from "./types";

type BookingDateCalendarProps = {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
  occupancyByDate?: Record<string, CalendarDayBooking[]>;
  blockedDates?: string[];
  minDate?: string;
  loadingOccupied?: boolean;
};

function todayIso(): string {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

export default function BookingDateCalendar({
  selectedDates,
  onChange,
  occupancyByDate = {},
  blockedDates = [],
  minDate,
  loadingOccupied = false,
}: BookingDateCalendarProps) {
  const today = todayIso();
  const min = minDate ?? today;
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [direction, setDirection] = useState(0);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const weeks = useMemo(
    () => getCalendarGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates]);
  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates]);

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

  function handleDayClick(cell: CalendarCell) {
    if (cell.iso < min) return;

    setExpandedDate((current) => (current === cell.iso ? null : cell.iso));

    if (!cell.isCurrentMonth) {
      const delta =
        cell.year > viewYear || (cell.year === viewYear && cell.monthIndex > viewMonth) ? 1 : -1;
      setView(cell.year, cell.monthIndex, delta);
    }

    if (blockedSet.has(cell.iso)) {
      return;
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
    setExpandedDate(first);
  }

  const expandedBookings = expandedDate ? (occupancyByDate[expandedDate] ?? []) : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-white via-[var(--admin-accent)]/[0.03] to-zinc-50 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 px-5 py-4 dark:border-zinc-800">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--admin-accent)]">
            Calendario
          </p>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Toca un día para ver ocupación · vuelve a tocar para cerrar
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loadingOccupied ? (
            <span className="rounded-full bg-zinc-200/80 px-3 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-800">
              Cargando…
            </span>
          ) : null}
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
        blockedSet={blockedSet}
        occupancyByDate={occupancyByDate}
        expandedDate={expandedDate}
        onDayClick={handleDayClick}
      />

      <CalendarDayAccordion
        dateIso={expandedDate}
        bookings={expandedBookings}
        onClose={() => setExpandedDate(null)}
      />

      <SelectedDatesList selectedDates={selectedDates} onChange={onChange} />
    </div>
  );
}
