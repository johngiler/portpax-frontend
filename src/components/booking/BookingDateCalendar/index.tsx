"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
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

export type BookingDateCalendarVisibleRange = {
  from: string;
  to: string;
};

type BookingDateCalendarProps = {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
  occupancyByDate?: Record<string, CalendarDayBooking[]>;
  blockedDates?: string[];
  minDate?: string;
  loadingOccupied?: boolean;
  canReassignOccupancy?: boolean;
  onOccupancyReassigned?: () => void;
  /** Fires when the visible month grid range changes (incl. leading/trailing days). */
  onVisibleRangeChange?: (range: BookingDateCalendarVisibleRange) => void;
};

function todayIso(): string {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

function gridRange(
  year: number,
  monthIndex: number,
): BookingDateCalendarVisibleRange {
  const weeks = getCalendarGrid(year, monthIndex);
  const first = weeks[0]?.[0];
  const lastWeek = weeks[weeks.length - 1];
  const last = lastWeek?.[lastWeek.length - 1];
  return {
    from: first?.iso ?? toIsoDate(year, monthIndex, 1),
    to: last?.iso ?? toIsoDate(year, monthIndex + 1, 0),
  };
}

export default function BookingDateCalendar({
  selectedDates,
  onChange,
  occupancyByDate = {},
  blockedDates = [],
  minDate,
  loadingOccupied = false,
  canReassignOccupancy = false,
  onOccupancyReassigned,
  onVisibleRangeChange,
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

  const visibleRange = useMemo(
    () => gridRange(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  useEffect(() => {
    onVisibleRangeChange?.(visibleRange);
  }, [visibleRange, onVisibleRangeChange]);

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
    if (loadingOccupied) return;
    if (cell.iso < min) return;

    const dayBookings = occupancyByDate[cell.iso] ?? [];
    const hasOccupancy = dayBookings.length > 0;

    if (hasOccupancy) {
      setExpandedDate((current) => (current === cell.iso ? null : cell.iso));
    } else {
      setExpandedDate(null);
    }

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
    const firstBookings = occupancyByDate[first] ?? [];
    setExpandedDate(firstBookings.length > 0 ? first : null);
  }

  const expandedBookings = expandedDate ? (occupancyByDate[expandedDate] ?? []) : [];
  const showAccordion = expandedDate != null && expandedBookings.length > 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-white via-[var(--admin-accent)]/[0.03] to-zinc-50 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 px-5 py-4 dark:border-zinc-800">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--admin-accent)]">
            Calendario
          </p>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Selecciona fechas libres · toca un día ocupado para ver escalas
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loadingOccupied ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--admin-accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--admin-accent)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Cargando ocupaciones…
            </span>
          ) : null}
          {selectedDates.length > 0 ? (
            <button
              type="button"
              onClick={jumpToFirstSelected}
              disabled={loadingOccupied}
              className="cursor-pointer rounded-full border border-zinc-200/80 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-[var(--admin-accent)]/30 hover:text-[var(--admin-accent)] disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300"
            >
              Ver selección
            </button>
          ) : null}
          <span className="rounded-full bg-[var(--admin-accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--admin-accent)]">
            {selectedDates.length} fecha{selectedDates.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="relative">
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
          occupancyByDate={loadingOccupied ? {} : occupancyByDate}
          expandedDate={loadingOccupied ? null : expandedDate}
          onDayClick={handleDayClick}
        />

        {loadingOccupied ? (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/70 backdrop-blur-[2px] dark:bg-zinc-950/60"
            aria-busy="true"
            aria-live="polite"
          >
            <Loader2
              className="h-8 w-8 animate-spin text-[var(--admin-accent)]"
              strokeWidth={2}
              aria-hidden
            />
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Cargando ocupaciones del puerto…
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Espera a que termine para seleccionar fechas
            </p>
          </div>
        ) : null}
      </div>

      {!loadingOccupied ? (
        <CalendarDayAccordion
          dateIso={showAccordion ? expandedDate : null}
          bookings={expandedBookings}
          onClose={() => setExpandedDate(null)}
          canReassign={canReassignOccupancy}
          onBookingReassigned={onOccupancyReassigned}
        />
      ) : null}

      <SelectedDatesList
        selectedDates={selectedDates}
        onChange={loadingOccupied ? () => undefined : onChange}
      />
    </div>
  );
}
