"use client";

import { useEffect, useRef } from "react";
import { formatIsoDateLabel, localTodayIso } from "@/lib/bookingDates";
import type { BookingCalendarFocus } from "@/lib/bookingCatalogFocus";
import type { BookingListItem } from "@/types/booking";
import type { Position } from "@/types/catalog";
import {
  calendarDayGroups,
  visibleDayBookings,
} from "./calendarDayGroups";
import DayCallGroups from "./DayCallGroups";
import {
  TRAFFIC_DOT,
  activePierPositions,
  dayTrafficLight,
} from "./calendarOpsUtils";

type MobileWeekAgendaProps = {
  days: string[];
  bookings: BookingListItem[];
  positions: Position[];
  multiPort: boolean;
  focus: BookingCalendarFocus;
  scrollToToday?: boolean;
};

export default function MobileWeekAgenda({
  days,
  bookings,
  positions,
  multiPort,
  focus,
  scrollToToday = false,
}: MobileWeekAgendaProps) {
  const todayIso = localTodayIso();
  const todayRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!scrollToToday) return;
    todayRef.current?.scrollIntoView({ block: "start" });
  }, [scrollToToday, days[0]]);

  return (
    <div className="space-y-3">
      {days.map((iso) => {
        const groups = calendarDayGroups(
          bookings,
          iso,
          positions,
          multiPort,
          focus,
        );
        const visible = visibleDayBookings(bookings, iso, focus);
        const active = visible.filter((booking) => booking.status !== "c");
        const traffic = multiPort
          ? active.length === 0
            ? "free"
            : active.length <= 2
              ? "limited"
              : "full"
          : dayTrafficLight(active, activePierPositions(positions).length);
        const isToday = iso === todayIso;
        const count = active.length;

        return (
          <section
            key={iso}
            ref={isToday ? todayRef : undefined}
            className={[
              "scroll-mt-2 rounded-2xl border px-3 py-3",
              isToday
                ? "border-[var(--admin-accent)]/40 bg-[var(--admin-accent)]/[0.06] dark:border-[var(--admin-accent)]/35 dark:bg-[var(--admin-accent)]/10"
                : "border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/60",
            ].join(" ")}
          >
            <header className="mb-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatIsoDateLabel(iso, "short")}
                </p>
                {isToday ? (
                  <p className="text-[11px] font-medium text-[var(--admin-accent)]">
                    Hoy
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {count > 0 ? (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {count}
                  </span>
                ) : null}
                <span
                  className={`h-2.5 w-2.5 rounded-full ${TRAFFIC_DOT[traffic]}`}
                  aria-hidden
                />
              </div>
            </header>
            <DayCallGroups
              groups={groups}
              focus={focus}
              showPort={multiPort}
            />
          </section>
        );
      })}
    </div>
  );
}
