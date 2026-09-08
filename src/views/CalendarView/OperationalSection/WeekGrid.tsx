"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatIsoDateLabel, formatIsoWeekdayShort } from "@/lib/bookingDates";
import type { BookingListItem } from "@/types/booking";
import type { Position } from "@/types/catalog";
import BookingsViewSkeleton from "@/views/BookingsView/BookingsViewSkeleton";
import type { BookingCalendarFocus } from "@/lib/bookingCatalogFocus";
import {
  bookingMatchesCalendarFocus,
  bookingsWithFocusNeighbors,
} from "@/lib/bookingCatalogFocus";
import CallChip from "./CallChip";
import {
  TRAFFIC_DOT,
  activePierPositions,
  addDaysIso,
  dayTrafficLight,
  weekDatesFrom,
} from "./calendarOpsUtils";

type WeekGridProps = {
  weekAnchor: string;
  onWeekAnchorChange?: (iso: string) => void;
  bookings: BookingListItem[];
  positions: Position[];
  /** @deprecated Soft-focus uses focus.positionId; columns always show all piers. */
  positionFilterId?: number;
  multiPort?: boolean;
  loading?: boolean;
  focus?: BookingCalendarFocus;
  /** Hide week navigation (dashboard snap). */
  readOnly?: boolean;
  /** Translucent sticky chrome so a parent card gradient shows through. */
  embedded?: boolean;
};

function dayBookingsVisible(
  bookings: BookingListItem[],
  date: string,
  focus: BookingCalendarFocus,
): BookingListItem[] {
  return bookingsWithFocusNeighbors(
    bookings.filter((b) => b.call_date === date),
    focus,
  );
}

function bookingsForCell(
  bookings: BookingListItem[],
  date: string,
  positionId: number | null,
  focus: BookingCalendarFocus,
): BookingListItem[] {
  const day = dayBookingsVisible(bookings, date, focus);
  return day.filter((b) => {
    if (positionId === null) return b.position == null;
    return b.position === positionId;
  });
}

function weekChrome(embedded: boolean) {
  if (!embedded) {
    return {
      scroll: "overflow-x-auto",
      table: "min-w-[52rem] w-full border-collapse text-left",
      corner:
        "sticky left-0 top-0 z-30 w-36 bg-white px-2 py-2 text-xs font-semibold text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
      headDay:
        "sticky top-0 z-20 min-w-[8.5rem] border-b border-zinc-200 bg-white px-1.5 py-2 text-center text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
      side:
        "sticky left-0 z-10 border-r border-zinc-200 bg-white px-2 py-2 align-top text-xs font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100",
      cell: "border-b border-r border-zinc-100 px-1 py-1.5 align-top dark:border-zinc-800",
      sideLabel: "w-36",
    };
  }

  // Dashboard embedded: lightly frosted chrome so the parent gradient still reads.
  // Parent scroll container owns overflow so sticky thead/side work together.
  return {
    scroll: "",
    table: "min-w-[52rem] w-full border-collapse text-left",
    corner:
      "sticky left-0 top-0 z-30 w-36 border-b border-r border-zinc-300/55 bg-white/55 px-2 py-2.5 text-xs font-semibold text-zinc-600 backdrop-blur-sm dark:border-zinc-600/45 dark:bg-zinc-900/55 dark:text-zinc-300",
    headDay:
      "sticky top-0 z-20 min-w-[8.5rem] border-b border-r border-zinc-300/50 bg-white/50 px-1.5 py-2.5 text-center text-xs font-semibold text-zinc-700 backdrop-blur-sm dark:border-zinc-600/40 dark:bg-zinc-900/50 dark:text-zinc-200",
    side:
      "sticky left-0 z-10 border-b border-r border-zinc-300/50 bg-white/50 px-2 py-2 align-top text-xs font-semibold text-zinc-800 backdrop-blur-sm dark:border-zinc-600/40 dark:bg-zinc-900/50 dark:text-zinc-100",
    cell: "border-b border-r border-zinc-200/60 bg-white/35 px-1 py-1.5 align-top dark:border-zinc-700/45 dark:bg-zinc-900/25",
    sideLabel: "w-36",
  };
}

export default function WeekGrid({
  weekAnchor,
  onWeekAnchorChange,
  bookings,
  positions,
  multiPort = false,
  loading = false,
  focus = {},
  readOnly = false,
  embedded = false,
}: WeekGridProps) {
  const days = weekDatesFrom(weekAnchor);
  const pierRows = activePierPositions(positions);
  const chrome = weekChrome(embedded);

  const portNames = multiPort
    ? [...new Set(bookings.map((b) => b.port_name || "Puerto"))].sort((a, b) =>
        a.localeCompare(b, "es"),
      )
    : [];

  const sideLabel = multiPort ? "Puerto" : "Posición";
  const sideWidth = multiPort ? "w-36" : "w-28";

  return (
    <div className="space-y-3">
      {!readOnly ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Semana anterior"
              onClick={() => onWeekAnchorChange?.(addDaysIso(days[0], -7))}
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="min-w-[12rem] text-center text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {formatIsoDateLabel(days[0], "short")} –{" "}
              {formatIsoDateLabel(days[6], "short")}
            </p>
            <button
              type="button"
              aria-label="Semana siguiente"
              onClick={() => onWeekAnchorChange?.(addDaysIso(days[0], 7))}
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                onWeekAnchorChange?.(
                  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
                );
              }}
              className="ml-1 cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--admin-accent)] hover:bg-[var(--admin-accent)]/10"
            >
              Ir a hoy
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <BookingsViewSkeleton variant="calendar" calendarMode="weekly" />
      ) : multiPort ? (
        <div className={chrome.scroll}>
          <table className={chrome.table}>
            <thead>
              <tr>
                <th className={`${sideWidth} ${chrome.corner}`}>{sideLabel}</th>
                {days.map((iso) => {
                  const dayBookingListItems = dayBookingsVisible(
                    bookings,
                    iso,
                    focus,
                  ).filter((b) => b.status !== "c");
                  const traffic =
                    dayBookingListItems.length === 0
                      ? "free"
                      : dayBookingListItems.length <= 2
                        ? "limited"
                        : "full";
                  return (
                    <th key={iso} className={chrome.headDay}>
                      <span className="inline-flex flex-col items-center justify-center gap-0.5">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`h-2 w-2 rounded-full ${TRAFFIC_DOT[traffic]}`}
                          />
                          <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            {formatIsoWeekdayShort(iso)}
                          </span>
                        </span>
                        <span className="font-medium text-zinc-600 dark:text-zinc-300">
                          {formatIsoDateLabel(iso, "short")}
                        </span>
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {portNames.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-8 text-center text-sm text-zinc-500"
                  >
                    Sin escalas en esta semana.
                  </td>
                </tr>
              ) : (
                portNames.map((portName) => (
                  <tr key={portName}>
                    <td className={chrome.side}>{portName}</td>
                    {days.map((iso) => {
                      const cell = bookingsWithFocusNeighbors(
                        bookings.filter(
                          (b) =>
                            b.call_date === iso &&
                            (b.port_name || "Puerto") === portName,
                        ),
                        focus,
                      );
                      return (
                        <td key={iso} className={chrome.cell}>
                          <div className="flex min-h-[4.5rem] flex-col gap-1">
                            {cell.map((b) => (
                              <CallChip
                                key={b.id}
                                booking={b}
                                focused={bookingMatchesCalendarFocus(b, focus)}
                              />
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={chrome.scroll}>
          <table className={chrome.table}>
            <thead>
              <tr>
                <th className={`${sideWidth} ${chrome.corner}`}>{sideLabel}</th>
                {days.map((iso) => {
                  const dayBookingListItems = dayBookingsVisible(
                    bookings,
                    iso,
                    focus,
                  ).filter((b) => b.status !== "c");
                  const traffic = dayTrafficLight(
                    dayBookingListItems,
                    pierRows.length,
                  );
                  return (
                    <th key={iso} className={chrome.headDay}>
                      <span className="inline-flex flex-col items-center justify-center gap-0.5">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`h-2 w-2 rounded-full ${TRAFFIC_DOT[traffic]}`}
                          />
                          <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            {formatIsoWeekdayShort(iso)}
                          </span>
                        </span>
                        <span>{formatIsoDateLabel(iso, "short")}</span>
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {pierRows.map((position) => (
                <tr key={position.id}>
                  <td className={chrome.side}>
                    {position.short_code || position.code}
                  </td>
                  {days.map((iso) => {
                    const cell = bookingsForCell(
                      bookings,
                      iso,
                      position.id,
                      focus,
                    );
                    return (
                      <td key={iso} className={chrome.cell}>
                        <div className="flex min-h-[4.5rem] flex-col gap-1">
                          {cell.map((b) => (
                            <CallChip
                              key={b.id}
                              booking={b}
                              focused={bookingMatchesCalendarFocus(b, focus)}
                            />
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td
                  className={
                    embedded
                      ? "sticky left-0 z-10 border-b border-r border-amber-300/60 bg-amber-50/80 px-2 py-2 align-top text-xs font-semibold text-amber-900 backdrop-blur-md dark:border-amber-700/40 dark:bg-amber-950/50 dark:text-amber-200"
                      : "sticky left-0 z-10 border-r border-zinc-200 bg-amber-50/80 px-2 py-2 align-top text-xs font-semibold text-amber-800 dark:border-zinc-700 dark:bg-amber-950/40 dark:text-amber-300"
                  }
                >
                  Sin asignar
                </td>
                {days.map((iso) => {
                  const cell = bookingsForCell(bookings, iso, null, focus);
                  return (
                    <td
                      key={iso}
                      className={
                        embedded
                          ? "border-b border-r border-amber-200/50 bg-amber-50/35 px-1 py-1.5 align-top dark:border-amber-800/30 dark:bg-amber-950/25"
                          : "border-b border-r border-zinc-100 bg-amber-50/30 px-1 py-1.5 align-top dark:border-zinc-800 dark:bg-amber-950/20"
                      }
                    >
                      <div className="flex min-h-[4.5rem] flex-col gap-1">
                        {cell.map((b) => (
                          <CallChip
                            key={b.id}
                            booking={b}
                            focused={bookingMatchesCalendarFocus(b, focus)}
                          />
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
