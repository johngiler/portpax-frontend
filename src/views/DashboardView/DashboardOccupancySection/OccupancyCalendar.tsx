"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getMonthOptions,
  parseIsoDate,
  toIsoDate,
} from "@/lib/bookingDates";
import { useMotionTransition } from "@/lib/motionPresets";
import { OCCUPANCY_MAX_FORWARD_YEARS } from "@/utils/timeRange";
import type { Booking } from "@/types/booking";
import { portDisplayName, type Port } from "@/types/catalog";
import { filterBookingsByPort } from "./occupancyUtils";
import { portAccentColor } from "./portColors";
import OccupancyYearMonth from "./OccupancyYearMonth";

const NAV_BUTTON_CLASS =
  "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-zinc-200/80 bg-white text-zinc-600 transition-colors hover:border-[var(--admin-accent)]/40 hover:text-[var(--admin-accent)] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300";

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

function yearOptions(dateFrom: string, dateTo: string): number[] {
  const minYear = parseIsoDate(dateFrom).year;
  const maxYear = Math.max(
    parseIsoDate(dateTo).year,
    new Date().getFullYear() + OCCUPANCY_MAX_FORWARD_YEARS,
  );
  return Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index);
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
  const years = useMemo(() => yearOptions(dateFrom, dateTo), [dateFrom, dateTo]);
  const monthOptions = useMemo(() => getMonthOptions(), []);

  const initialYear = useMemo(() => {
    if (selectedDate) return parseIsoDate(selectedDate).year;
    return parseIsoDate(dateFrom).year;
  }, [dateFrom, selectedDate]);

  const [viewYear, setViewYear] = useState(initialYear);
  const [direction, setDirection] = useState(0);
  const transition = useMotionTransition(0.2);

  useEffect(() => {
    if (selectedDate) {
      setViewYear(parseIsoDate(selectedDate).year);
      return;
    }
    setViewYear(parseIsoDate(dateFrom).year);
  }, [dateFrom, selectedDate]);

  function shiftYear(delta: number) {
    const nextYear = viewYear + delta;
    if (nextYear < years[0] || nextYear > years[years.length - 1]) return;
    setDirection(delta);
    setViewYear(nextYear);
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
              {portDisplayName(port)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 px-5 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftYear(-1)}
            disabled={viewYear <= years[0]}
            className={NAV_BUTTON_CLASS}
            aria-label="Año anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[5rem] text-center text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {viewYear}
          </span>
          <button
            type="button"
            onClick={() => shiftYear(1)}
            disabled={viewYear >= years[years.length - 1]}
            className={NAV_BUTTON_CLASS}
            aria-label="Año siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setDirection(0);
            setViewYear(new Date().getFullYear());
          }}
          className="cursor-pointer rounded-full px-3 py-1 text-xs font-semibold text-[var(--admin-accent)] transition-colors hover:bg-[var(--admin-accent)]/10"
        >
          Ir a hoy
        </button>
      </div>

      <div className="relative px-5 py-5">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={viewYear}
            custom={direction}
            initial={{ opacity: 0, x: direction >= 0 ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction >= 0 ? -20 : 20 }}
            transition={transition}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {monthOptions.map((month) => (
              <OccupancyYearMonth
                key={`${viewYear}-${month.value}`}
                year={viewYear}
                monthIndex={month.value}
                monthLabel={month.label}
                dateFrom={dateFrom}
                dateTo={dateTo}
                todayIso={today}
                selectedDate={selectedDate}
                dayBookings={dayBookings}
                onSelectDate={onSelectDate}
              />
            ))}
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
