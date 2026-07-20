"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import type { Booking } from "@/types/booking";
import type { Position } from "@/types/catalog";
import CallChip from "./CallChip";
import {
  TRAFFIC_DOT,
  TRAFFIC_LABEL,
  activePierPositions,
  addDaysIso,
  dayTrafficLight,
  weekDatesFrom,
} from "./calendarOpsUtils";

type WeekGridProps = {
  weekAnchor: string;
  onWeekAnchorChange: (iso: string) => void;
  bookings: Booking[];
  positions: Position[];
  positionFilterId: number;
};

function bookingsForCell(
  bookings: Booking[],
  date: string,
  positionId: number | null,
): Booking[] {
  return bookings.filter((b) => {
    if (b.call_date !== date) return false;
    if (positionId === null) return b.position == null;
    return b.position === positionId;
  });
}

export default function WeekGrid({
  weekAnchor,
  onWeekAnchorChange,
  bookings,
  positions,
  positionFilterId,
}: WeekGridProps) {
  const days = weekDatesFrom(weekAnchor);
  const pierAll = activePierPositions(positions);
  const pierRows =
    positionFilterId > 0
      ? pierAll.filter((p) => p.id === positionFilterId)
      : pierAll;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Semana anterior"
            onClick={() => onWeekAnchorChange(addDaysIso(days[0], -7))}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="min-w-[12rem] text-center text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            {formatIsoDateLabel(days[0], "short")} – {formatIsoDateLabel(days[6], "short")}
          </p>
          <button
            type="button"
            aria-label="Semana siguiente"
            onClick={() => onWeekAnchorChange(addDaysIso(days[0], 7))}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              onWeekAnchorChange(
                `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
              );
            }}
            className="ml-1 cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--admin-accent)] hover:bg-[var(--admin-accent)]/10"
          >
            Ir a hoy
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

      <div className="overflow-x-auto">
        <table className="min-w-[52rem] w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-28 bg-white px-2 py-2 text-xs font-semibold text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                Muelle
              </th>
              {days.map((iso) => {
                const dayBookings = bookings.filter(
                  (b) => b.call_date === iso && b.status !== "c",
                );
                const traffic = dayTrafficLight(dayBookings, pierAll.length);
                return (
                  <th
                    key={iso}
                    className="min-w-[8.5rem] cursor-default px-1.5 py-2 text-center text-xs font-semibold text-zinc-600 dark:text-zinc-300"
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${TRAFFIC_DOT[traffic]}`} />
                      {formatIsoDateLabel(iso, "short")}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pierRows.map((position) => (
              <tr
                key={position.id}
                className="border-t border-zinc-100 dark:border-zinc-800"
              >
                <td className="sticky left-0 z-10 bg-white px-2 py-2 align-top text-xs font-semibold text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                  {position.short_code || position.code}
                </td>
                {days.map((iso) => {
                  const cell = bookingsForCell(bookings, iso, position.id);
                  return (
                    <td
                      key={iso}
                      className="px-1 py-1.5 align-top"
                    >
                      <div className="flex min-h-[4.5rem] flex-col gap-1">
                        {cell.map((b) => (
                          <CallChip key={b.id} booking={b} />
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {positionFilterId === 0 ? (
              <tr className="border-t border-dashed border-zinc-200 dark:border-zinc-700">
                <td className="sticky left-0 z-10 bg-amber-50/80 px-2 py-2 align-top text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  Sin asignar
                </td>
                {days.map((iso) => {
                  const cell = bookingsForCell(bookings, iso, null);
                  return (
                    <td
                      key={iso}
                      className="bg-amber-50/30 px-1 py-1.5 align-top dark:bg-amber-950/20"
                    >
                      <div className="flex min-h-[4.5rem] flex-col gap-1">
                        {cell.map((b) => (
                          <CallChip key={b.id} booking={b} />
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
