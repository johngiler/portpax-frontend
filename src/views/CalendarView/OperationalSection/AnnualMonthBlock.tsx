"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { toIsoDate } from "@/lib/bookingDates";
import { currentReturnTo } from "@/lib/safeReturnTo";
import { formatLoa } from "@/lib/bookingDisplay";
import {
  bookingDetailHref,
  type Booking,
} from "@/types/booking";
import type { Position } from "@/types/catalog";
import {
  CORP_CHIP_CLASS,
  corpKeyFromShippingLineCode,
} from "@/views/CalendarView/corpColors";
import { summarizeMonth } from "./calendarOpsUtils";

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

function AnnualCallCell({ booking }: { booking: Booking }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const corp = corpKeyFromShippingLineCode(booking.shipping_line_code);
  return (
    <Link
      href={bookingDetailHref(booking, {
        returnTo: currentReturnTo(pathname, searchParams),
      })}
      className={[
        "block max-w-[4.5rem] truncate rounded px-0.5 py-0.5 text-[8px] font-semibold leading-tight sm:max-w-[5.5rem] sm:text-[9px]",
        CORP_CHIP_CLASS[corp],
      ].join(" ")}
      title={booking.vessel_name}
      onClick={(e) => e.stopPropagation()}
    >
      {booking.vessel_name}
    </Link>
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
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:bg-zinc-900">
                {multiPort ? "Puerto" : "Posición"}
              </th>
              {days.map((day) => (
                <th
                  key={day}
                  className="px-0.5 py-1.5 text-center text-[9px] font-medium tabular-nums text-zinc-400"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowKeys.map((key) => {
              const position =
                !multiPort && key.startsWith("pos:")
                  ? pierRows.find((p) => p.id === Number(key.slice(4)))
                  : null;
              const label = multiPort
                ? key
                : key === "unassigned"
                  ? "Sin asignar"
                  : (position?.code ?? key);
              return (
                <tr
                  key={key}
                  className="border-t border-zinc-100 dark:border-zinc-800"
                >
                  <th className="sticky left-0 z-10 whitespace-nowrap bg-white px-2 py-1 text-left text-[10px] font-semibold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                    {label}
                    {availabilityCheck && position?.max_loa_m ? (
                      <span className="mt-0.5 block font-normal text-zinc-400">
                        {formatLoa(position.max_loa_m)}
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
                    return (
                      <td
                        key={iso}
                        className="min-w-[2.25rem] px-0.5 py-0.5 align-top"
                      >
                        {cellBookings.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {cellBookings.map((b) => (
                              <AnnualCallCell key={b.id} booking={b} />
                            ))}
                          </div>
                        ) : availabilityCheck &&
                          !multiPort &&
                          position?.max_loa_m ? (
                          <span
                            className="block text-center text-[8px] tabular-nums text-emerald-600/80 dark:text-emerald-400/70"
                            title={`Hueco · max ${formatLoa(position.max_loa_m)}`}
                          >
                            {formatLoa(position.max_loa_m)}
                          </span>
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
