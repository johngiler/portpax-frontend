"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthMatrix, getMonthOptions, toIsoDate } from "@/lib/bookingDates";
import type { Booking } from "@/types/booking";
import type { Position } from "@/types/catalog";
import BookingsViewSkeleton from "@/views/BookingsView/BookingsViewSkeleton";
import {
  activePierPositions,
  dayAnnualHeat,
} from "./calendarOpsUtils";

const WEEKDAYS = ["D", "L", "M", "X", "J", "V", "S"];

const TRAFFIC_CELL: Record<string, string> = {
  free: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
  limited:
    "bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-200",
  full: "bg-red-100 text-red-950 dark:bg-red-950/50 dark:text-red-200",
  empty: "bg-white text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600",
};

type AnnualGridProps = {
  year: number;
  onYearChange: (year: number) => void;
  bookings: Booking[];
  previousYearBookings: Booking[];
  positions: Position[];
  multiPort?: boolean;
  loading?: boolean;
  onSelectMonth?: (monthIndex: number) => void;
};

export default function AnnualGrid({
  year,
  onYearChange,
  bookings,
  previousYearBookings: _previousYearBookings,
  positions,
  multiPort = false,
  loading = false,
  onSelectMonth,
}: AnnualGridProps) {
  const pierCount = activePierPositions(positions).length;
  const monthOptions = getMonthOptions();

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const booking of bookings) {
      if (booking.status === "c") continue;
      const list = map.get(booking.call_date) ?? [];
      list.push(booking);
      map.set(booking.call_date, list);
    }
    return map;
  }, [bookings]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 px-1">
        <button
          type="button"
          aria-label="Año anterior"
          onClick={() => onYearChange(year - 1)}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="min-w-[5rem] text-center text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {year}
        </p>
        <button
          type="button"
          aria-label="Año siguiente"
          onClick={() => onYearChange(year + 1)}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <BookingsViewSkeleton variant="calendar" calendarMode="annual" />
      ) : (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {monthOptions.map((month) => {
          const matrix = getMonthMatrix(year, month.value);
          let monthCallCount = 0;
          for (const [iso, dayBookings] of bookingsByDate) {
            const [y, m] = iso.split("-").map(Number);
            if (y === year && m === month.value + 1) {
              monthCallCount += dayBookings.length;
            }
          }
          return (
            <div
              key={month.value}
              className="rounded-xl border border-zinc-200/80 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-900/80"
            >
              <button
                type="button"
                onClick={() => onSelectMonth?.(month.value)}
                className="mb-2 w-full cursor-pointer rounded-lg px-1 py-1 text-left text-xs font-semibold capitalize text-zinc-800 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                {month.label}{" "}
                <span className="font-normal text-zinc-500">
                  · {monthCallCount} call{monthCallCount === 1 ? "" : "s"}
                </span>
              </button>
              <div className="grid grid-cols-7 gap-0.5">
                {WEEKDAYS.map((label) => (
                  <div
                    key={label}
                    className="text-center text-[9px] font-medium text-zinc-400"
                  >
                    {label}
                  </div>
                ))}
                {matrix.flatMap((week, wi) =>
                  week.map((day, di) => {
                    if (day == null) {
                      return (
                        <div
                          key={`e-${month.value}-${wi}-${di}`}
                          className="h-6"
                        />
                      );
                    }
                    const iso = toIsoDate(year, month.value, day);
                    const dayBookings = bookingsByDate.get(iso) ?? [];
                    const traffic = dayAnnualHeat(
                      dayBookings,
                      pierCount,
                      multiPort,
                    );
                    const count = dayBookings.length;
                    return (
                      <div
                        key={iso}
                        title={
                          count > 0
                            ? `${iso}: ${count} escala${count === 1 ? "" : "s"}`
                            : iso
                        }
                        className={[
                          "flex h-6 items-center justify-center rounded text-[9px] font-medium",
                          TRAFFIC_CELL[traffic],
                          count > 0 ? "font-bold" : "",
                        ].join(" ")}
                      >
                        {count > 0 ? count : day}
                      </div>
                    );
                  }),
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
