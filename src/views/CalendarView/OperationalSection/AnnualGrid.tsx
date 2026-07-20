"use client";

import { ChevronLeft, ChevronRight, Ship, TrendingUp, Users } from "lucide-react";
import ViewStatCard from "@/components/layout/ViewStatCard";
import { getMonthMatrix, getMonthOptions, toIsoDate } from "@/lib/bookingDates";
import type { Booking } from "@/types/booking";
import type { Position } from "@/types/catalog";
import {
  TRAFFIC_DOT,
  TRAFFIC_LABEL,
  activePierPositions,
  dayTrafficLight,
  summarizeYear,
  yoyDeltaPct,
} from "./calendarOpsUtils";

const WEEKDAYS = ["D", "L", "M", "X", "J", "V", "S"];

const TRAFFIC_CELL: Record<string, string> = {
  free: "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  limited: "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  full: "bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200",
  empty: "bg-white text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600",
};

type AnnualGridProps = {
  year: number;
  onYearChange: (year: number) => void;
  bookings: Booking[];
  previousYearBookings: Booking[];
  positions: Position[];
  onSelectMonth?: (monthIndex: number) => void;
};

export default function AnnualGrid({
  year,
  onYearChange,
  bookings,
  previousYearBookings,
  positions,
  onSelectMonth,
}: AnnualGridProps) {
  const pierCount = activePierPositions(positions).length;
  const current = summarizeYear(bookings, year);
  const previous = summarizeYear(previousYearBookings, year - 1);
  const callsDelta = yoyDeltaPct(current.calls, previous.calls);
  const paxDelta = yoyDeltaPct(current.plannedPax, previous.plannedPax);
  const monthOptions = getMonthOptions();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
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
        <ul className="flex flex-wrap gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
          {(["free", "limited", "full"] as const).map((key) => (
            <li key={key} className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${TRAFFIC_DOT[key]}`} />
              {TRAFFIC_LABEL[key]}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ViewStatCard
          label="Calls del año"
          value={current.calls.toLocaleString("es-MX")}
          description={
            callsDelta == null
              ? `vs ${year - 1}: n/d`
              : `vs ${year - 1}: ${callsDelta > 0 ? "+" : ""}${callsDelta}% (${previous.calls})`
          }
          icon={Ship}
          accentColor="#3478b5"
          gradient="linear-gradient(160deg, rgba(52, 120, 181, 0.14) 0%, var(--background) 55%)"
        />
        <ViewStatCard
          label="PAX planificado"
          value={current.plannedPax.toLocaleString("es-MX")}
          description={
            paxDelta == null
              ? `vs ${year - 1}: n/d`
              : `vs ${year - 1}: ${paxDelta > 0 ? "+" : ""}${paxDelta}%`
          }
          icon={Users}
          accentColor="#0d9488"
          gradient="linear-gradient(160deg, rgba(13, 148, 136, 0.14) 0%, var(--background) 55%)"
        />
        <ViewStatCard
          label="Calls año anterior"
          value={previous.calls.toLocaleString("es-MX")}
          description={`${year - 1}`}
          icon={TrendingUp}
          accentColor="#7c3aed"
          gradient="linear-gradient(160deg, rgba(124, 58, 237, 0.12) 0%, var(--background) 55%)"
        />
        <ViewStatCard
          label="PAX año anterior"
          value={previous.plannedPax.toLocaleString("es-MX")}
          description={`${year - 1}`}
          icon={Users}
          accentColor="#ca8a04"
          gradient="linear-gradient(160deg, rgba(202, 138, 4, 0.12) 0%, var(--background) 55%)"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {monthOptions.map((month) => {
          const matrix = getMonthMatrix(year, month.value);
          const monthBookings = bookings.filter((b) => {
            const [y, m] = b.call_date.split("-").map(Number);
            return y === year && m === month.value + 1 && b.status !== "c";
          });
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
                  · {monthBookings.length} calls
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
                      return <div key={`e-${month.value}-${wi}-${di}`} className="h-6" />;
                    }
                    const iso = toIsoDate(year, month.value, day);
                    const dayBookings = bookings.filter(
                      (b) => b.call_date === iso && b.status !== "c",
                    );
                    const traffic =
                      dayBookings.length === 0
                        ? "empty"
                        : dayTrafficLight(dayBookings, pierCount);
                    const count = dayBookings.length;
                    return (
                      <div
                        key={iso}
                        className={[
                          "flex h-6 items-center justify-center rounded text-[9px] font-medium",
                          TRAFFIC_CELL[traffic],
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
    </div>
  );
}
