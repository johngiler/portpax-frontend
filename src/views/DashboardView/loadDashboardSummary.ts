import { fetchBookings } from "@/services/bookings/bookingService";
import { fetchPorts } from "@/services/catalogs/portService";
import { fetchShippingLines } from "@/services/catalogs/shippingLineService";
import { fetchVessels } from "@/services/catalogs/vesselService";
import type { Booking } from "@/types/booking";
import type { TimeRange } from "@/utils/timeRange";

export type DashboardSummary = {
  bookingsTotal: number;
  bookingsRequested: number;
  bookingsConfirmed: number;
  bookingsCancelled: number;
  portsTotal: number;
  shippingLinesTotal: number;
  vesselsTotal: number;
  upcomingBookings: Booking[];
};

export async function loadDashboardSummary(timeRange: TimeRange): Promise<DashboardSummary> {
  const { date_from, date_to } = timeRange;
  const dateParams = { call_date_from: date_from, call_date_to: date_to, pageSize: 1 };

  const [
    bookingsAll,
    bookingsRequested,
    bookingsConfirmed,
    bookingsCancelled,
    ports,
    shippingLines,
    vessels,
    upcoming,
  ] = await Promise.all([
    fetchBookings(dateParams),
    fetchBookings({ ...dateParams, status: "requested" }),
    fetchBookings({ ...dateParams, status: "confirmed" }),
    fetchBookings({ ...dateParams, status: "cancelled" }),
    fetchPorts({ pageSize: 1 }),
    fetchShippingLines({ pageSize: 1 }),
    fetchVessels({ pageSize: 1 }),
    fetchBookings({
      call_date_from: date_from,
      call_date_to: date_to,
      ordering: "call_date",
      pageSize: 6,
    }),
  ]);

  return {
    bookingsTotal: bookingsAll.count,
    bookingsRequested: bookingsRequested.count,
    bookingsConfirmed: bookingsConfirmed.count,
    bookingsCancelled: bookingsCancelled.count,
    portsTotal: ports.count,
    shippingLinesTotal: shippingLines.count,
    vesselsTotal: vessels.count,
    upcomingBookings: upcoming.results,
  };
}
