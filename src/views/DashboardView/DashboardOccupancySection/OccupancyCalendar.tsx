"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import CalendarNav from "@/components/booking/BookingDateCalendar/CalendarNav";
import { formatIsoDateLabel, getCalendarGrid, toIsoDate } from "@/lib/bookingDates";
import { useMotionTransition } from "@/lib/motionPresets";
import type { Booking } from "@/types/booking";
import type { Port } from "@/types/catalog";
import { activeCountForDate, filterBookingsByPort } from "./occupancyUtils";
import { occupancyHeatClass, portAccentColor } from "./portColors";

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type OccupancyCalendarProps = {
  dateFrom: string;
  dateTo: string;
  ports: Port[];
  byDate: Record<string, Booking[]>;
  selectedDate: string | null;
  selectedPortId: number | null;
  onSelectDate: (date: string | null) => void;
  onSelectPort: (portId: number | null) => void;
};

function todayIso(): string {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

export default function OccupancyCalendar({
  dateFrom,
  dateTo,
  ports,
  byDate,
  selectedDate,
  selectedPortId,
  onSelectDate,
  onSelectPort,
}: OccupancyCalendarProps) {
  const today = todayIso();
  const initial = useMemo(() => {
    const anchor = selectedDate && selectedDate >= dateFrom && selectedDate <= dateTo
      ? selectedDate
      : dateFrom;
    const [year, month] = anchor.split("-").map(Number);
    return { year, monthIndex: month - 1 };
  }, [dateFrom, selectedDate]);

  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.monthIndex);
  const [direction, setDirection] = useState(0);
  const transition = useMotionTransition(0.2);

  useEffect(() => {
    const anchor =
      selectedDate && selectedDate >= dateFrom && selectedDate <= dateTo
        ? selectedDate
        : dateFrom;
    const [year, month] = anchor.split("-").map(Number);
    setViewYear(year);
    setViewMonth(month - 1);
  }, [dateFrom, dateTo, selectedDate]);

  const weeks = useMemo(() => getCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  function setView(year: number, monthIndex: number, navDirection: number) {
    setDirection(navDirection);
    setViewYear(year);
    setViewMonth(monthIndex);
  }

  function goToToday() {
    const now = new Date();
    setView(now.getFullYear(), now.getMonth(), 0);
  }

  function dayBookings(iso: string): Booking[] {
    const bookings = byDate[iso] ?? [];
    return filterBookingsByPort(bookings, selectedPortId);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-white via-[var(--admin-accent)]/[0.02] to-zinc-50 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950">
      <div className="border-b border-zinc-200/80 px-5 py-4 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectPort(null)}
            className={[
              "cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              selectedPortId === null
                ? "bg-[var(--admin-accent)] text-white shadow-sm"
                : "border border-zinc-200/80 bg-white text-zinc-600 hover:border-[var(--admin-accent)]/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
            ].join(" ")}
          >
            Todos los puertos
          </button>
          {ports.map((port) => (
            <button
              key={port.id}
              type="button"
              onClick={() => onSelectPort(port.id)}
              className={[
                "cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                selectedPortId === port.id
                  ? "text-white shadow-sm"
                  : "border border-zinc-200/80 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
              ].join(" ")}
              style={
                selectedPortId === port.id
                  ? { backgroundColor: portAccentColor(port.id) }
                  : undefined
              }
            >
              {port.code}
            </button>
          ))}
        </div>
      </div>

      <CalendarNav
        viewYear={viewYear}
        viewMonth={viewMonth}
        minIso={dateFrom}
        onViewChange={setView}
        onGoToToday={goToToday}
      />

      <div className="grid grid-cols-7 gap-2 px-5 pb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="relative min-h-[22rem] px-5 pb-5">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={`${viewYear}-${viewMonth}`}
            custom={direction}
            initial={{ opacity: 0, x: direction >= 0 ? 24 : -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction >= 0 ? -24 : 24 }}
            transition={transition}
            className="grid grid-cols-7 gap-2"
          >
            {weeks.flat().map((cell) => {
              const inRange = cell.iso >= dateFrom && cell.iso <= dateTo;
              const bookings = dayBookings(cell.iso);
              const count = activeCountForDate(bookings);
              const isSelected = selectedDate === cell.iso;
              const isToday = cell.iso === today;
              const portIds = [...new Set(bookings.filter((b) => b.status !== "cancelled").map((b) => b.port))];

              return (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={!inRange}
                  onClick={() => inRange && onSelectDate(isSelected ? null : cell.iso)}
                  className={[
                    "group relative flex min-h-[4.5rem] cursor-pointer flex-col rounded-2xl border px-1 pb-1.5 pt-2 text-left transition-all duration-200",
                    occupancyHeatClass(count, inRange),
                    !cell.isCurrentMonth && inRange ? "opacity-70" : "",
                    isSelected
                      ? "ring-2 ring-[var(--admin-accent)] ring-offset-2 ring-offset-white dark:ring-offset-zinc-900"
                      : "",
                    isToday && !isSelected ? "ring-1 ring-[var(--admin-accent)]/30" : "",
                    !inRange ? "cursor-default" : "hover:-translate-y-0.5 hover:shadow-md",
                  ].join(" ")}
                  aria-label={
                    inRange
                      ? `${formatIsoDateLabel(cell.iso)} — ${count} escala${count === 1 ? "" : "s"}`
                      : formatIsoDateLabel(cell.iso)
                  }
                  aria-pressed={isSelected}
                >
                  <span
                    className={[
                      "w-full text-center text-sm font-bold leading-none",
                      count > 0 ? "text-[var(--admin-accent)]" : "text-zinc-700 dark:text-zinc-200",
                    ].join(" ")}
                  >
                    {cell.day}
                  </span>

                  {inRange && count > 0 ? (
                    <span className="mt-1 w-full text-center text-[10px] font-bold text-[var(--admin-accent)]">
                      {count}
                    </span>
                  ) : null}

                  {inRange && portIds.length > 0 ? (
                    <span className="mt-auto flex w-full justify-center gap-0.5 pt-1">
                      {portIds.slice(0, 4).map((portId) => (
                        <span
                          key={portId}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: portAccentColor(portId) }}
                        />
                      ))}
                      {portIds.length > 4 ? (
                        <span className="text-[8px] font-bold text-zinc-400">+{portIds.length - 4}</span>
                      ) : null}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-zinc-200/80 px-5 py-3 text-[10px] text-zinc-500 dark:border-zinc-800">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" />
          Libre
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[var(--admin-accent)]/15" />
          Baja
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[var(--admin-accent)]/35" />
          Alta
        </span>
      </div>
    </div>
  );
}
