"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthMatrix, getMonthOptions, toIsoDate } from "@/lib/bookingDates";
import BookingsViewSkeleton from "@/views/BookingsView/BookingsViewSkeleton";
import type { BookingListItem } from "@/types/booking";
import type { Position } from "@/types/catalog";
import CallChip from "./CallChip";
import type { BookingCalendarFocus } from "@/lib/bookingCatalogFocus";
import {
  bookingMatchesCalendarFocus,
  bookingsWithFocusNeighbors,
} from "@/lib/bookingCatalogFocus";
import {
  TRAFFIC_DOT,
  activePierPositions,
  dayTrafficLight,
} from "./calendarOpsUtils";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type MonthGridProps = {
  year: number;
  monthIndex: number;
  onYearChange: (year: number) => void;
  onMonthChange: (monthIndex: number) => void;
  bookings: BookingListItem[];
  positions: Position[];
  multiPort?: boolean;
  loading?: boolean;
  focus?: BookingCalendarFocus;
};

function groupByPort(bookings: BookingListItem[]): { port: string; items: BookingListItem[] }[] {
  const map = new Map<string, BookingListItem[]>();
  for (const b of bookings) {
    const key = b.port_name || "Puerto";
    const list = map.get(key) ?? [];
    list.push(b);
    map.set(key, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "es"))
    .map(([port, items]) => ({ port, items }));
}

export default function MonthGrid({
  year,
  monthIndex,
  onYearChange,
  onMonthChange,
  bookings,
  positions,
  multiPort = false,
  loading = false,
  focus = {},
}: MonthGridProps) {
  const matrix = getMonthMatrix(year, monthIndex);
  const pierCount = activePierPositions(positions).length;
  const monthOptions = getMonthOptions();

  function shiftMonth(delta: number) {
    const d = new Date(year, monthIndex + delta, 1);
    onYearChange(d.getFullYear());
    onMonthChange(d.getMonth());
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Mes anterior"
            onClick={() => shiftMonth(-1)}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="min-w-[10rem] text-center text-sm font-semibold capitalize text-zinc-800 dark:text-zinc-100">
            {monthOptions.find((o) => o.value === monthIndex)?.label} {year}
          </p>
          <button
            type="button"
            aria-label="Mes siguiente"
            onClick={() => shiftMonth(1)}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <BookingsViewSkeleton variant="calendar" calendarMode="monthly" />
      ) : (
      <div className="overflow-x-auto">
        <div className="min-w-[52rem] grid grid-cols-7 gap-px rounded-xl border border-zinc-200 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-700">
          {WEEKDAYS.map((label) => (
            <div
              key={label}
              className="bg-zinc-50 px-2 py-2 text-center text-[11px] font-semibold text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
            >
              {label}
            </div>
          ))}
          {matrix.flatMap((week, wi) =>
            week.map((day, di) => {
              if (day == null) {
                return (
                  <div
                    key={`e-${wi}-${di}`}
                    className="min-h-[7rem] bg-zinc-50/80 dark:bg-zinc-950/40"
                  />
                );
              }
              const iso = toIsoDate(year, monthIndex, day);
              const dayBookings = bookingsWithFocusNeighbors(
                bookings.filter((b) => b.call_date === iso),
                focus,
              );
              const active = dayBookings.filter((b) => b.status !== "c");
              const traffic = multiPort
                ? active.length === 0
                  ? "free"
                  : active.length <= 2
                    ? "limited"
                    : "full"
                : dayTrafficLight(active, pierCount);
              const byPort = multiPort
                ? groupByPort(dayBookings).map((group) => ({
                    ...group,
                    items: bookingsWithFocusNeighbors(group.items, focus),
                  })).filter((group) => group.items.length > 0)
                : null;
              const maxShow = multiPort ? 6 : 4;

              return (
                <div
                  key={iso}
                  className="flex min-h-[8.5rem] flex-col gap-1 bg-white p-1.5 dark:bg-zinc-900"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                      {day}
                    </span>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${TRAFFIC_DOT[traffic]}`}
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                    {byPort
                      ? byPort.map((group) => (
                          <div key={group.port} className="min-w-0 space-y-0.5">
                            <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-zinc-400">
                              {group.port}
                            </p>
                            {group.items.slice(0, 2).map((b) => (
                              <CallChip
                                key={b.id}
                                booking={b}
                                compact
                                focused={bookingMatchesCalendarFocus(b, focus)}
                              />
                            ))}
                            {group.items.length > 2 ? (
                              <span className="text-[9px] text-zinc-500">
                                +{group.items.length - 2}
                              </span>
                            ) : null}
                          </div>
                        ))
                      : dayBookings.slice(0, maxShow).map((b) => (
                          <CallChip
                            key={b.id}
                            booking={b}
                            compact
                            focused={bookingMatchesCalendarFocus(b, focus)}
                          />
                        ))}
                    {!byPort && dayBookings.length > maxShow ? (
                      <span className="text-[10px] text-zinc-500">
                        +{dayBookings.length - maxShow} más
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            }),
          )}
        </div>
      </div>
      )}
    </div>
  );
}
