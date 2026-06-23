import { enumerateIsoDates } from "@/lib/bookingDates";
import type { Booking } from "@/types/booking";
import type { Port } from "@/types/catalog";

export type OccupancySnapshot = {
  dates: string[];
  ports: Port[];
  byDate: Record<string, Booking[]>;
  byPortDate: Record<number, Record<string, Booking[]>>;
};

function isActiveBooking(booking: Booking): boolean {
  return booking.status !== "cancelled";
}

export function buildOccupancySnapshot(
  bookings: Booking[],
  ports: Port[],
  dateFrom: string,
  dateTo: string,
): OccupancySnapshot {
  const dates = enumerateIsoDates(dateFrom, dateTo);
  const byDate: Record<string, Booking[]> = {};
  const byPortDate: Record<number, Record<string, Booking[]>> = {};

  for (const port of ports) {
    byPortDate[port.id] = {};
    for (const date of dates) {
      byPortDate[port.id][date] = [];
    }
  }

  for (const date of dates) {
    byDate[date] = [];
  }

  for (const booking of bookings) {
    if (!dates.includes(booking.call_date)) continue;
    byDate[booking.call_date]?.push(booking);
    byPortDate[booking.port]?.[booking.call_date]?.push(booking);
  }

  return {
    dates,
    ports,
    byDate,
    byPortDate,
  };
}

export function filterBookingsByPort(bookings: Booking[], portId: number | null): Booking[] {
  if (!portId) return bookings;
  return bookings.filter((booking) => booking.port === portId);
}

export function activeCountForDate(bookings: Booking[]): number {
  return bookings.filter(isActiveBooking).length;
}
