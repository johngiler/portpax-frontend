import type { BookingCalendarFocus } from "@/lib/bookingCatalogFocus";
import { bookingsWithFocusNeighbors } from "@/lib/bookingCatalogFocus";
import type { BookingListItem } from "@/types/booking";
import type { Position } from "@/types/catalog";
import { activePierPositions } from "./calendarOpsUtils";

export type CalendarDayGroup = {
  key: string;
  label: string;
  bookings: BookingListItem[];
};

export function visibleDayBookings(
  bookings: BookingListItem[],
  date: string,
  focus: BookingCalendarFocus,
): BookingListItem[] {
  return bookingsWithFocusNeighbors(
    bookings.filter((booking) => booking.call_date === date),
    focus,
  );
}

/** Occupied positions / ports for a day. Empty groups are omitted (mobile agenda). */
export function calendarDayGroups(
  bookings: BookingListItem[],
  date: string,
  positions: Position[],
  multiPort: boolean,
  focus: BookingCalendarFocus,
): CalendarDayGroup[] {
  const day = visibleDayBookings(bookings, date, focus);
  if (multiPort) {
    const map = new Map<string, BookingListItem[]>();
    for (const booking of day) {
      const label = booking.port_name || "Puerto";
      const list = map.get(label) ?? [];
      list.push(booking);
      map.set(label, list);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "es"))
      .map(([label, items]) => ({ key: label, label, bookings: items }));
  }

  const groups: CalendarDayGroup[] = [];
  for (const position of activePierPositions(positions)) {
    const items = day.filter((booking) => booking.position === position.id);
    if (items.length === 0) continue;
    groups.push({
      key: String(position.id),
      label: position.short_code || position.code,
      bookings: items,
    });
  }
  const unassigned = day.filter((booking) => booking.position == null);
  if (unassigned.length > 0) {
    groups.push({
      key: "unassigned",
      label: "Sin asignar",
      bookings: unassigned,
    });
  }
  return groups;
}
