"use client";

import { formatIsoDateLabel, getCalendarGrid, type CalendarCell } from "@/lib/bookingDates";
import type { Booking } from "@/types/booking";
import { activeCountForDate } from "./occupancyUtils";
import { occupancyHeatClass, portAccentColor } from "./portColors";

type OccupancyYearMonthProps = {
  year: number;
  monthIndex: number;
  monthLabel: string;
  dateFrom: string;
  dateTo: string;
  todayIso: string;
  selectedDate: string | null;
  dayBookings: (iso: string) => Booking[];
  onSelectDate: (date: string | null) => void;
};

export default function OccupancyYearMonth({
  year,
  monthIndex,
  monthLabel,
  dateFrom,
  dateTo,
  todayIso,
  selectedDate,
  dayBookings,
  onSelectDate,
}: OccupancyYearMonthProps) {
  const weeks = getCalendarGrid(year, monthIndex);

  function renderDay(cell: CalendarCell) {
    if (!cell.isCurrentMonth) {
      return <span key={cell.iso} className="h-7 w-7 shrink-0" aria-hidden />;
    }

    const inRange = cell.iso >= dateFrom && cell.iso <= dateTo;
    const bookings = dayBookings(cell.iso);
    const count = activeCountForDate(bookings);
    const isSelected = selectedDate === cell.iso;
    const isToday = cell.iso === todayIso;
    const portIds = [
      ...new Set(bookings.filter((b) => b.status !== "cancelled").map((b) => b.port)),
    ];

    return (
      <button
        key={cell.iso}
        type="button"
        disabled={!inRange}
        onClick={() => inRange && onSelectDate(isSelected ? null : cell.iso)}
        className={[
          "relative flex h-7 w-7 shrink-0 cursor-pointer flex-col items-center justify-center rounded-md border text-[9px] font-bold leading-none transition-all",
          occupancyHeatClass(count, inRange),
          isSelected
            ? "ring-2 ring-[var(--admin-accent)] ring-offset-1 ring-offset-white dark:ring-offset-zinc-900"
            : "",
          isToday && !isSelected ? "ring-1 ring-[var(--admin-accent)]/35" : "",
          !inRange ? "cursor-default opacity-40" : "hover:shadow-sm",
        ].join(" ")}
        aria-label={
          inRange
            ? `${formatIsoDateLabel(cell.iso)} — ${count} escala${count === 1 ? "" : "s"}`
            : formatIsoDateLabel(cell.iso)
        }
        aria-pressed={isSelected}
      >
        <span>{cell.day}</span>
        {inRange && count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[var(--admin-accent)] px-0.5 text-[7px] font-bold text-white">
            {count}
          </span>
        ) : null}
        {inRange && portIds.length > 0 && count === 0 ? (
          <span
            className="absolute bottom-0.5 h-1 w-1 rounded-full"
            style={{ backgroundColor: portAccentColor(portIds[0]) }}
          />
        ) : null}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200/70 bg-white/80 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
      <p className="mb-2 text-xs font-semibold capitalize text-zinc-700 dark:text-zinc-200">
        {monthLabel}
      </p>
      <div className="flex flex-wrap gap-0.5">{weeks.flat().map(renderDay)}</div>
    </div>
  );
}
