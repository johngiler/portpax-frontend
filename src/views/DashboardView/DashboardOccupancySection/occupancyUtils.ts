import { enumerateIsoDates } from "@/lib/bookingDates";
import type { Booking } from "@/types/booking";
import type { Port } from "@/types/catalog";

export type OccupancyStats = {
  totalActive: number;
  peakDay: { date: string; count: number } | null;
  busiestPort: { portId: number; name: string; count: number } | null;
  avgPerDay: number;
};

export type OccupancySnapshot = {
  dates: string[];
  ports: Port[];
  byDate: Record<string, Booking[]>;
  byPortDate: Record<number, Record<string, Booking[]>>;
  stats: OccupancyStats;
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

  const activeBookings = bookings.filter(isActiveBooking);

  for (const booking of bookings) {
    if (!dates.includes(booking.call_date)) continue;
    byDate[booking.call_date]?.push(booking);
    byPortDate[booking.port]?.[booking.call_date]?.push(booking);
  }

  let peakDay: OccupancyStats["peakDay"] = null;
  for (const date of dates) {
    const count = byDate[date].filter(isActiveBooking).length;
    if (!peakDay || count > peakDay.count) {
      peakDay = count > 0 ? { date, count } : peakDay;
    }
  }

  const portTotals = ports.map((port) => ({
    portId: port.id,
    name: port.name,
    count: activeBookings.filter((booking) => booking.port === port.id).length,
  }));
  const busiestPort = portTotals.reduce<OccupancyStats["busiestPort"]>(
    (best, current) =>
      current.count > 0 && (!best || current.count > best.count) ? current : best,
    null,
  );

  const totalActive = activeBookings.length;
  const avgPerDay = dates.length > 0 ? Math.round((totalActive / dates.length) * 10) / 10 : 0;

  return {
    dates,
    ports,
    byDate,
    byPortDate,
    stats: { totalActive, peakDay, busiestPort, avgPerDay },
  };
}

export function filterBookingsByPort(bookings: Booking[], portId: number | null): Booking[] {
  if (!portId) return bookings;
  return bookings.filter((booking) => booking.port === portId);
}

export function activeCountForDate(bookings: Booking[]): number {
  return bookings.filter(isActiveBooking).length;
}
