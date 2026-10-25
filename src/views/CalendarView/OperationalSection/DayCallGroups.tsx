"use client";

import BookingAgendaCard from "@/components/booking/BookingAgendaCard";
import {
  bookingMatchesCalendarFocus,
  type BookingCalendarFocus,
} from "@/lib/bookingCatalogFocus";
import type { CalendarDayGroup } from "./calendarDayGroups";

type DayCallGroupsProps = {
  groups: CalendarDayGroup[];
  focus: BookingCalendarFocus;
  showPort?: boolean;
  emptyLabel?: string;
};

export default function DayCallGroups({
  groups,
  focus,
  showPort = true,
  emptyLabel = "Sin escalas",
}: DayCallGroupsProps) {
  if (groups.length === 0) {
    return (
      <p className="px-1 py-3 text-sm text-zinc-500 dark:text-zinc-400">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.key} className="space-y-2">
          <h4 className="px-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {group.label}
          </h4>
          <ul className="space-y-2">
            {group.bookings.map((booking) => (
              <li key={booking.id}>
                <BookingAgendaCard
                  booking={booking}
                  focused={bookingMatchesCalendarFocus(booking, focus)}
                  showPort={showPort}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
