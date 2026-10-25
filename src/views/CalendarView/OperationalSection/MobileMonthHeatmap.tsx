"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import { formatIsoDateLabel, localTodayIso, toIsoDate } from "@/lib/bookingDates";
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

const WEEKDAYS = [
  { short: "D", label: "Domingo" },
  { short: "L", label: "Lunes" },
  { short: "M", label: "Martes" },
  { short: "X", label: "Miércoles" },
  { short: "J", label: "Jueves" },
  { short: "V", label: "Viernes" },
  { short: "S", label: "Sábado" },
];

type MobileMonthHeatmapProps = {
  year: number;
  monthIndex: number;
  matrix: (number | null)[][];
  bookings: BookingListItem[];
  positions: Position[];
  multiPort: boolean;
  focus: BookingCalendarFocus;
};

export default function MobileMonthHeatmap({
  year,
  monthIndex,
  matrix,
  bookings,
  positions,
  multiPort,
  focus,
}: MobileMonthHeatmapProps) {
  const todayIso = localTodayIso();
  const pierCount = activePierPositions(positions).length;
  const [openIso, setOpenIso] = useState<string | null>(null);

  const openGroups = useMemo(() => {
    if (!openIso) return [];
    return calendarDayGroups(bookings, openIso, positions, multiPort, focus);
  }, [openIso, bookings, positions, multiPort, focus]);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
        <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-700">
          {WEEKDAYS.map((day) => (
            <div
              key={day.short}
              className="bg-zinc-50 py-2 text-center text-[11px] font-semibold text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
            >
              <span aria-hidden>{day.short}</span>
              <span className="sr-only">{day.label}</span>
            </div>
          ))}
          {matrix.flatMap((week, wi) =>
            week.map((day, di) => {
              if (day == null) {
                return (
                  <div
                    key={`e-${wi}-${di}`}
                    className="min-h-12 bg-zinc-50/80 dark:bg-zinc-950/40"
                  />
                );
              }
              const iso = toIsoDate(year, monthIndex, day);
              const visible = visibleDayBookings(bookings, iso, focus);
              const active = visible.filter((booking) => booking.status !== "c");
              const traffic = multiPort
                ? active.length === 0
                  ? "free"
                  : active.length <= 2
                    ? "limited"
                    : "full"
                : dayTrafficLight(active, pierCount);
              const isToday = iso === todayIso;
              const count = active.length;

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setOpenIso(iso)}
                  className={[
                    "flex min-h-12 flex-col items-center justify-center gap-0.5 bg-white px-0.5 py-1.5 dark:bg-zinc-900",
                    isToday
                      ? "ring-2 ring-inset ring-[var(--admin-accent)]"
                      : "",
                  ].join(" ")}
                  aria-label={`${formatIsoDateLabel(iso, "short")}${count > 0 ? `, ${count} escalas` : ", sin escalas"}`}
                >
                  <span
                    className={[
                      "text-xs font-semibold tabular-nums",
                      isToday
                        ? "text-[var(--admin-accent)]"
                        : "text-zinc-700 dark:text-zinc-200",
                    ].join(" ")}
                  >
                    {day}
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${TRAFFIC_DOT[traffic]}`}
                      aria-hidden
                    />
                    {count > 0 ? (
                      <span className="text-[10px] font-semibold tabular-nums text-zinc-500 dark:text-zinc-400">
                        {count}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            }),
          )}
        </div>
      </div>

      <Modal
        open={openIso != null}
        onClose={() => setOpenIso(null)}
        title={openIso ? formatIsoDateLabel(openIso, "long") : ""}
        panelClassName="max-w-lg"
      >
        <DayCallGroups
          groups={openGroups}
          focus={focus}
          showPort={multiPort}
        />
      </Modal>
    </>
  );
}
