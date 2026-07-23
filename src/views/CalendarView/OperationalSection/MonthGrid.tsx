"use client";

import { ChevronLeft, ChevronRight, CalendarDays, MapPin, Ship, Users } from "lucide-react";
import { getMonthMatrix, getMonthOptions, toIsoDate } from "@/lib/bookingDates";
import type { Booking } from "@/types/booking";
import type { Position } from "@/types/catalog";
import ViewStatCard from "@/components/layout/ViewStatCard";
import CallChip from "./CallChip";
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
  bookings: Booking[];
  positions: Position[];
  multiPort?: boolean;
};

function groupByPort(bookings: Booking[]): { port: string; items: Booking[] }[] {
  const map = new Map<string, Booking[]>();
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
}: MonthGridProps) {
  const matrix = getMonthMatrix(year, monthIndex);
  const pierCount = activePierPositions(positions).length;
  const monthBookings = bookings.filter((b) => {
    const [y, m] = b.call_date.split("-").map(Number);
    return y === year && m === monthIndex + 1 && b.status !== "c";
  });
  const calls = monthBookings.length;
  const plannedPax = monthBookings.reduce((sum, b) => sum + (b.planned_pax ?? 0), 0);
  const portCount = new Set(monthBookings.map((b) => b.port)).size;
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

      <div className="grid gap-3 sm:grid-cols-3">
        <ViewStatCard
          label="Calls del mes"
          value={String(calls)}
          description="Excluye canceladas"
          icon={Ship}
          accentColor="#3478b5"
          gradient="linear-gradient(160deg, rgba(52, 120, 181, 0.14) 0%, var(--background) 55%)"
        />
        <ViewStatCard
          label="PAX planificado"
          value={plannedPax.toLocaleString("es-MX")}
          description="Suma de planned_pax"
          icon={Users}
          accentColor="#0d9488"
          gradient="linear-gradient(160deg, rgba(13, 148, 136, 0.14) 0%, var(--background) 55%)"
        />
        <ViewStatCard
          label={multiPort ? "Puertos con escala" : "Muelles pier"}
          value={String(multiPort ? portCount : pierCount)}
          description={
            multiPort ? "Puertos con al menos un call" : "Posiciones activas del puerto"
          }
          icon={multiPort ? MapPin : CalendarDays}
          accentColor="#7c3aed"
          gradient="linear-gradient(160deg, rgba(124, 58, 237, 0.12) 0%, var(--background) 55%)"
        />
      </div>

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
              const dayBookings = bookings.filter((b) => b.call_date === iso);
              const active = dayBookings.filter((b) => b.status !== "c");
              const traffic = multiPort
                ? active.length === 0
                  ? "free"
                  : active.length <= 2
                    ? "limited"
                    : "full"
                : dayTrafficLight(active, pierCount);
              const byPort = multiPort ? groupByPort(dayBookings) : null;
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
                              <CallChip key={b.id} booking={b} compact />
                            ))}
                            {group.items.length > 2 ? (
                              <span className="text-[9px] text-zinc-500">
                                +{group.items.length - 2}
                              </span>
                            ) : null}
                          </div>
                        ))
                      : dayBookings.slice(0, maxShow).map((b) => (
                          <CallChip key={b.id} booking={b} compact />
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
    </div>
  );
}
