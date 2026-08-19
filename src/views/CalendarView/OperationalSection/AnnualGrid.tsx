"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthOptions } from "@/lib/bookingDates";
import type { BookingListItem } from "@/types/booking";
import type { Position } from "@/types/catalog";
import BookingsViewSkeleton from "@/views/BookingsView/BookingsViewSkeleton";
import AnnualMonthBlock from "./AnnualMonthBlock";
import {
  activePierPositions,
  monthsInSeason,
  seasonBounds,
  seasonLabel,
  summarizeRange,
  type CalendarSeason,
} from "./calendarOpsUtils";

type AnnualGridProps = {
  year: number;
  onYearChange: (year: number) => void;
  season: CalendarSeason;
  onSeasonChange?: (season: CalendarSeason) => void;
  bookings: BookingListItem[];
  previousYearBookings: BookingListItem[];
  positions: Position[];
  positionFilterId?: number;
  multiPort?: boolean;
  loading?: boolean;
  onSelectMonth?: (monthIndex: number) => void;
};

export default function AnnualGrid({
  year,
  onYearChange,
  season,
  onSeasonChange,
  bookings,
  previousYearBookings,
  positions,
  positionFilterId = 0,
  multiPort = false,
  loading = false,
  onSelectMonth,
}: AnnualGridProps) {
  const [availabilityCheck, setAvailabilityCheck] = useState(false);
  const monthOptions = getMonthOptions();
  const months = useMemo(() => monthsInSeason(year, season), [year, season]);
  const range = useMemo(() => seasonBounds(year, season), [year, season]);
  const totals = useMemo(
    () => summarizeRange(bookings, range.from, range.to),
    [bookings, range],
  );
  const prevRange = useMemo(
    () => seasonBounds(year - 1, season),
    [year, season],
  );
  const prevTotals = useMemo(
    () => summarizeRange(previousYearBookings, prevRange.from, prevRange.to),
    [previousYearBookings, prevRange],
  );

  const pierAll = activePierPositions(positions);
  const pierRows =
    positionFilterId > 0
      ? pierAll.filter((p) => p.id === positionFilterId)
      : pierAll;

  const portNames = multiPort
    ? [
        ...new Set([
          ...bookings.map((b) => b.port_name || "Puerto"),
          ...pierAll.map((p) => p.port_name || "Puerto"),
        ]),
      ].sort((a, b) => a.localeCompare(b, "es"))
    : [];

  const seasonNavLabel =
    season === "winter"
      ? `${seasonLabel(season)} ${year}–${year + 1}`
      : `${seasonLabel(season)} ${year}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-label="Período anterior"
            onClick={() => onYearChange(year - 1)}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="min-w-[9rem] text-center text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            {seasonNavLabel}
          </p>
          <button
            type="button"
            aria-label="Período siguiente"
            onClick={() => onYearChange(year + 1)}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {onSeasonChange ? (
            <div className="ml-1 flex rounded-xl border border-zinc-200/80 p-0.5 dark:border-zinc-700">
              {(
                [
                  ["natural", "Natural"],
                  ["summer", "Summer"],
                  ["winter", "Winter"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onSeasonChange(value)}
                  className={[
                    "cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                    season === value
                      ? "bg-[var(--admin-accent)] text-white"
                      : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {totals.ships} barcos · {totals.plannedPax.toLocaleString("es-MX")}{" "}
            PAX
            {prevTotals.ships > 0 || totals.ships > 0 ? (
              <span className="text-zinc-400">
                {" "}
                · ant. {prevTotals.ships} /{" "}
                {prevTotals.plannedPax.toLocaleString("es-MX")} PAX
              </span>
            ) : null}
          </p>
          <button
            type="button"
            onClick={() => setAvailabilityCheck((v) => !v)}
            className={[
              "cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
              availabilityCheck
                ? "border-[var(--admin-accent)] bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800",
            ].join(" ")}
          >
            Ver disponibilidad
          </button>
        </div>
      </div>

      {loading ? (
        <BookingsViewSkeleton variant="calendar" calendarMode="annual" />
      ) : !multiPort && pierRows.length === 0 ? (
        <p className="px-1 text-sm text-zinc-500">
          Selecciona un puerto con posiciones activas para ver el anual tipo
          Excel.
        </p>
      ) : (
        <div className="space-y-4">
          {months.map(({ year: y, monthIndex: m }) => (
            <AnnualMonthBlock
              key={`${y}-${m}`}
              year={y}
              monthIndex={m}
              monthLabel={
                monthOptions.find((o) => o.value === m)?.label ?? String(m + 1)
              }
              bookings={bookings}
              pierRows={pierRows}
              multiPort={multiPort}
              portNames={portNames}
              availabilityCheck={availabilityCheck}
              onSelectMonth={
                y === year
                  ? onSelectMonth
                  : (monthIdx) => {
                      // Winter spans next year — jump to that month in monthly view.
                      onSelectMonth?.(monthIdx);
                    }
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
