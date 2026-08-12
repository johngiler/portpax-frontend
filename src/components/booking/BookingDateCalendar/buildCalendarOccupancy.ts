import type { Booking } from "@/types/booking";
import type { CalendarDayBooking } from "./types";

export function mergeBookingsById(...lists: Booking[][]): Booking[] {
  const map = new Map<number, Booking>();
  for (const list of lists) {
    for (const booking of list) {
      map.set(booking.id, booking);
    }
  }
  return [...map.values()];
}

/** Patch occupancy map entry after a hot update (position / schedule). */
export function applyBookingPositionToOccupancy(
  byDate: Record<string, CalendarDayBooking[]>,
  bookingId: number,
  positionId: number | null,
  positionCode: string | null,
  eta?: string | null,
  etd?: string | null,
): Record<string, CalendarDayBooking[]> {
  const next: Record<string, CalendarDayBooking[]> = {};
  for (const [date, rows] of Object.entries(byDate)) {
    next[date] = rows.map((row) =>
      row.id === bookingId
        ? {
            ...row,
            position_id: positionId,
            position_code: positionCode,
            ...(eta !== undefined ? { eta } : {}),
            ...(etd !== undefined ? { etd } : {}),
          }
        : row,
    );
  }
  return next;
}

export function buildCalendarOccupancy(
  bookings: Booking[],
  portId: number,
  vesselId: number,
): {
  byDate: Record<string, CalendarDayBooking[]>;
  blockedDates: string[];
} {
  const active = bookings.filter((booking) => booking.status !== "c");
  const byDate: Record<string, CalendarDayBooking[]> = {};
  const blockedDates: string[] = [];

  for (const booking of active) {
    const entry: CalendarDayBooking = {
      id: booking.id,
      booking_code: booking.booking_code,
      port_name: booking.port_name,
      shipping_line_name: booking.shipping_line_name,
      vessel_name: booking.vessel_name,
      vessel_id: booking.vessel,
      port_id: booking.port,
      call_date: booking.call_date,
      position_id: booking.position,
      position_code: booking.position_code,
      vessel_loa_m: booking.vessel_loa_m,
      eta: booking.eta,
      etd: booking.etd,
      status: booking.status,
      status_display: booking.status_display,
      blocksSelection: booking.port === portId && booking.vessel === vesselId,
      isCurrentPort: booking.port === portId,
    };

    if (!byDate[booking.call_date]) {
      byDate[booking.call_date] = [];
    }
    byDate[booking.call_date].push(entry);

    if (entry.blocksSelection && !blockedDates.includes(booking.call_date)) {
      blockedDates.push(booking.call_date);
    }
  }

  for (const date of Object.keys(byDate)) {
    byDate[date].sort((a, b) => a.vessel_name.localeCompare(b.vessel_name));
  }

  blockedDates.sort();
  return { byDate, blockedDates };
}
