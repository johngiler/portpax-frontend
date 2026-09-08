"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import ViewSection from "@/components/layout/ViewSection";
import { formatIsoDateLabel, localTodayIso } from "@/lib/bookingDates";
import { useCalendarBookings } from "@/hooks/swr/useCalendarBookings";
import type { DashboardCurrentWeek } from "@/types/dashboard";
import WeekGrid from "@/views/CalendarView/OperationalSection/WeekGrid";
import {
  isoWeekNumber,
  weekDatesFrom,
} from "@/views/CalendarView/OperationalSection/calendarOpsUtils";

type DashboardWeekArrivalsCardProps = {
  data: DashboardCurrentWeek;
};

export default function DashboardWeekArrivalsCard({
  data,
}: DashboardWeekArrivalsCardProps) {
  const today = localTodayIso();
  const days = useMemo(() => weekDatesFrom(today), [today]);
  const weekNum = data.iso_week ?? isoWeekNumber(today);

  // Ops snap of the current week — never scoped by dashboard port/carrier filters.
  const { bookings, positions, isLoading } = useCalendarBookings({
    mode: "weekly",
    portIds: [],
    from: days[0],
    to: days[6],
    year: Number(days[0].slice(0, 4)),
    search: "",
  });

  const rangeLabel =
    data.date_from && data.date_to
      ? `${formatIsoDateLabel(data.date_from, "short")} – ${formatIsoDateLabel(data.date_to, "short")}`
      : `${formatIsoDateLabel(days[0], "short")} – ${formatIsoDateLabel(days[6], "short")}`;

  return (
    <ViewSection
      icon={CalendarDays}
      title={`Arribos de la semana · Sem. ${weekNum}`}
      description={`Calls confirmados del ${rangeLabel}.`}
    >
      <div className="px-5 py-4 sm:px-6">
        <div className="mb-4 flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-300">
          <span>
            <strong className="tabular-nums text-zinc-900 dark:text-zinc-50">
              {data.total_confirmed.toLocaleString("es")}
            </strong>{" "}
            calls
          </span>
          <span>
            <strong className="tabular-nums text-zinc-900 dark:text-zinc-50">
              {data.planned_pax.toLocaleString("es")}
            </strong>{" "}
            Pax planificados
          </span>
        </div>
        <div className="max-h-[22rem] overflow-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
          <WeekGrid
            weekAnchor={today}
            bookings={bookings}
            positions={positions}
            multiPort
            loading={isLoading}
            readOnly
          />
        </div>
      </div>
    </ViewSection>
  );
}
