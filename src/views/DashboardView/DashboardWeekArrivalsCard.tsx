"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import ViewSection from "@/components/layout/ViewSection";
import { localTodayIso } from "@/lib/bookingDates";
import { useCalendarBookings } from "@/hooks/swr/useCalendarBookings";
import type { DashboardCarrierFilter, DashboardCurrentWeek } from "@/types/dashboard";
import WeekGrid from "@/views/CalendarView/OperationalSection/WeekGrid";
import {
  isoWeekNumber,
  weekDatesFrom,
} from "@/views/CalendarView/OperationalSection/calendarOpsUtils";

type DashboardWeekArrivalsCardProps = {
  data: DashboardCurrentWeek;
  portIds: number[];
  carrier: DashboardCarrierFilter;
};

export default function DashboardWeekArrivalsCard({
  data,
  portIds,
  carrier,
}: DashboardWeekArrivalsCardProps) {
  const today = localTodayIso();
  const days = useMemo(() => weekDatesFrom(today), [today]);
  const weekNum = data.iso_week ?? isoWeekNumber(today);

  const { bookings, positions, isLoading } = useCalendarBookings({
    mode: "weekly",
    portIds,
    from: days[0],
    to: days[6],
    year: Number(days[0].slice(0, 4)),
    search: "",
  });

  const focus =
    carrier.type === "line" ? { shippingLineId: carrier.id } : undefined;

  return (
    <ViewSection
      icon={CalendarDays}
      title={`Arribos de la semana · Sem. ${weekNum}`}
      description={`Calls confirmados del ${data.date_from} al ${data.date_to}.`}
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
            multiPort={portIds.length !== 1}
            loading={isLoading}
            focus={focus}
            readOnly
          />
        </div>
      </div>
    </ViewSection>
  );
}
