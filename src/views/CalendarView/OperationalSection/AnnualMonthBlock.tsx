"use client";

import { formatIsoWeekdayShort, toIsoDate } from "@/lib/bookingDates";
import { formatLoa } from "@/lib/bookingDisplay";
import type { Booking } from "@/types/booking";
import type { Position } from "@/types/catalog";
import CallChip from "./CallChip";
import {
  TRAFFIC_LABEL,
  dayTrafficLight,
  summarizeMonth,
} from "./calendarOpsUtils";

type AnnualMonthBlockProps = {
  year: number;
  monthIndex: number;
  monthLabel: string;
  bookings: Booking[];
  pierRows: Position[];
  multiPort: boolean;
  portNames: string[];
  availabilityCheck: boolean;
  onSelectMonth?: (monthIndex: number) => void;
};

function bookingsForCell(
  bookings: Booking[],
  date: string,
  positionId: number | null,
): Booking[] {
  return bookings.filter((b) => {
    if (b.call_date !== date || b.status === "c") return false;
    if (positionId === null) return b.position == null;
    return b.position === positionId;
  });
}

function bookingsForPortDay(
  bookings: Booking[],
  date: string,
  portName: string,
): Booking[] {
  return bookings.filter(
    (b) =>
      b.call_date === date &&
      b.status !== "c" &&
      (b.port_name || "Puerto") === portName,
  );
}

function piersForPort(pierRows: Position[], portName: string): Position[] {
  return pierRows.filter((p) => (p.port_name || "Puerto") === portName);
}

function maxLoaAmong(positions: Position[]): string | null {
  let best: number | null = null;
  for (const p of positions) {
    if (!p.max_loa_m) continue;
    const n = Number(p.max_loa_m);
    if (Number.isNaN(n)) continue;
    if (best == null || n > best) best = n;
  }
  return best == null ? null : String(best);
}

function freePiersForPortDay(
  pierRows: Position[],
  portName: string,
  cellBookings: Booking[],
): Position[] {
  const portPiers = piersForPort(pierRows, portName);
  const occupiedIds = new Set(
    cellBookings
      .filter((b) => b.position != null)
      .map((b) => b.position as number),
  );
  return portPiers.filter((p) => !occupiedIds.has(p.id));
}

function AvailabilityHint({
  label,
  title,
}: {
  label: string;
  title: string;
}) {
  return (
    <span
      className="block text-center text-[8px] leading-tight tabular-nums text-emerald-600/90 dark:text-emerald-400/80"
      title={title}
    >
      {label}
    </span>
  );
}

export default function AnnualMonthBlock({
  year,
  monthIndex,
  monthLabel,
  bookings,
  pierRows,
  multiPort,
  portNames,
  availabilityCheck,
  onSelectMonth,
}: AnnualMonthBlockProps) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totals = summarizeMonth(bookings, year, monthIndex);
  const paxLabel = totals.plannedPax.toLocaleString("es-MX");

  const rowKeys = multiPort
    ? portNames
    : [
        ...pierRows.map((p) => `pos:${p.id}`),
        "unassigned",
      ];

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => onSelectMonth?.(monthIndex)}
          className="cursor-pointer text-left text-sm font-semibold capitalize text-zinc-800 hover:text-[var(--admin-accent)] dark:text-zinc-100"
        >
          {monthLabel} {year}
        </button>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {totals.ships} barco{totals.ships === 1 ? "" : "s"}
          <span className="text-zinc-300 dark:text-zinc-600"> · </span>
          {paxLabel} PAX
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] border-collapse text-left">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:bg-zinc-900">
                {multiPort ? "Puerto" : "Posición"}
              </th>
              {days.map((day) => {
                const iso = toIsoDate(year, monthIndex, day);
                return (
                  <th
                    key={day}
                    className="min-w-[8.5rem] px-0.5 py-1.5 text-center font-medium text-zinc-400"
                  >
                    <span className="flex flex-col items-center gap-0.5 leading-tight">
                      <span className="text-[9px] font-semibold uppercase tracking-wide">
                        {formatIsoWeekdayShort(iso)}
                      </span>
                      <span className="text-[10px] tabular-nums">{day}</span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rowKeys.map((key) => {
              const position =
                !multiPort && key.startsWith("pos:")
                  ? pierRows.find((p) => p.id === Number(key.slice(4)))
                  : null;
              const portPiers = multiPort ? piersForPort(pierRows, key) : [];
              const label = multiPort
                ? key
                : key === "unassigned"
                  ? "Sin asignar"
                  : (position?.code ?? key);
              const rowHasBooking = days.some((day) => {
                const iso = toIsoDate(year, monthIndex, day);
                const cellBookings = multiPort
                  ? bookingsForPortDay(bookings, iso, key)
                  : bookingsForCell(
                      bookings,
                      iso,
                      key === "unassigned" ? null : Number(key.slice(4)),
                    );
                return cellBookings.length > 0;
              });
              const rowTint = rowHasBooking
                ? "bg-[var(--admin-accent)]/[0.06] dark:bg-[var(--admin-accent)]/10"
                : "bg-white dark:bg-zinc-900";
              return (
                <tr
                  key={key}
                  className={[
                    "border-t border-zinc-100 dark:border-zinc-800",
                    rowHasBooking
                      ? "bg-[var(--admin-accent)]/[0.06] dark:bg-[var(--admin-accent)]/10"
                      : "",
                  ].join(" ")}
                >
                  <th
                    className={[
                      "sticky left-0 z-10 whitespace-nowrap px-2 py-1 text-left text-[10px] font-semibold text-zinc-600 dark:text-zinc-300",
                      rowTint,
                    ].join(" ")}
                  >
                    {label}
                    {availabilityCheck && position?.max_loa_m ? (
                      <span className="mt-0.5 block font-normal text-zinc-400">
                        {formatLoa(position.max_loa_m)}
                      </span>
                    ) : null}
                    {availabilityCheck && multiPort && portPiers.length > 0 ? (
                      <span className="mt-0.5 block font-normal text-zinc-400">
                        {portPiers.length} muelle
                        {portPiers.length === 1 ? "" : "s"}
                        {maxLoaAmong(portPiers)
                          ? ` · max ${formatLoa(maxLoaAmong(portPiers))}`
                          : ""}
                      </span>
                    ) : null}
                  </th>
                  {days.map((day) => {
                    const iso = toIsoDate(year, monthIndex, day);
                    const cellBookings = multiPort
                      ? bookingsForPortDay(bookings, iso, key)
                      : bookingsForCell(
                          bookings,
                          iso,
                          key === "unassigned"
                            ? null
                            : Number(key.slice(4)),
                        );

                    const freePiers = multiPort
                      ? freePiersForPortDay(pierRows, key, cellBookings)
                      : [];
                    const freeMaxLoa = maxLoaAmong(freePiers);
                    const portTraffic =
                      multiPort && portPiers.length > 0
                        ? dayTrafficLight(cellBookings, portPiers.length)
                        : null;

                    return (
                      <td
                        key={iso}
                        className="min-w-[8.5rem] px-0.5 py-0.5 align-top"
                      >
                        {cellBookings.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {cellBookings.map((b) => (
                              <CallChip key={b.id} booking={b} compact />
                            ))}
                            {availabilityCheck &&
                            multiPort &&
                            portTraffic &&
                            freePiers.length > 0 ? (
                              <AvailabilityHint
                                label={`${freePiers.length} libre${freePiers.length === 1 ? "" : "s"}${freeMaxLoa ? ` · ${formatLoa(freeMaxLoa)}` : ""}`}
                                title={`${TRAFFIC_LABEL[portTraffic]} · ${freePiers.length} muelle(s) libre(s)`}
                              />
                            ) : null}
                          </div>
                        ) : availabilityCheck &&
                          !multiPort &&
                          position?.max_loa_m ? (
                          <AvailabilityHint
                            label={formatLoa(position.max_loa_m)}
                            title={`Hueco · max ${formatLoa(position.max_loa_m)}`}
                          />
                        ) : availabilityCheck &&
                          multiPort &&
                          portPiers.length > 0 ? (
                          <AvailabilityHint
                            label={
                              freeMaxLoa
                                ? `${freePiers.length} libre${freePiers.length === 1 ? "" : "s"} · ${formatLoa(freeMaxLoa)}`
                                : `${freePiers.length} libre${freePiers.length === 1 ? "" : "s"}`
                            }
                            title={`${TRAFFIC_LABEL[portTraffic ?? "free"]} · max ${formatLoa(freeMaxLoa)}`}
                          />
                        ) : (
                          <span className="block h-4" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
