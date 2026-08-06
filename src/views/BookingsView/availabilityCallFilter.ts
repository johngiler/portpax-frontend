import type { BookingListStatusFilter, BookingStatus } from "@/types/booking";
import { bookingTodayIso } from "@/types/booking";

const ACTIVE_STATUSES: BookingStatus[] = [
  "nr",
  "h",
  "co",
  "cl",
  "lta",
  "ltd",
];

export type AvailabilityCall = {
  booking_code: string;
  status?: string;
  shipping_line_name: string;
  shipping_line_logo: string | null;
  vessel_name: string;
  vessel_logo: string | null;
  loa_m: string | null;
  eta: string | null;
  etd: string | null;
};

/** Whether a call matches the availability status sidebar filter. */
export function availabilityCallMatchesStatus(
  call: Pick<AvailabilityCall, "status">,
  callDate: string,
  status: BookingListStatusFilter | string | undefined,
  todayIso = bookingTodayIso(),
): boolean {
  if (!status) return true;
  const code = call.status ?? "";
  if (status === "completed") {
    if (code === "c") return false;
    if (code === "r") return true;
    return (
      callDate < todayIso &&
      ACTIVE_STATUSES.includes(code as BookingStatus)
    );
  }
  if (status === "action") {
    return (
      (code === "nr" || code === "h") && callDate >= todayIso
    );
  }
  return code === status;
}

export function filterAvailabilityCalls<T extends AvailabilityCall>(
  calls: T[],
  callDate: string,
  status: BookingListStatusFilter | string | undefined,
  todayIso = bookingTodayIso(),
): T[] {
  if (!status) return calls;
  return calls.filter((call) =>
    availabilityCallMatchesStatus(call, callDate, status, todayIso),
  );
}
