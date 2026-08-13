import type {
  BookingListStatusFilter,
  BookingStatus,
  BookingStatusFilterValue,
} from "@/types/booking";
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
  has_conflict?: boolean;
  /** Home position; related columns may echo the same call for occupancy. */
  position_id?: number;
  shipping_line_name: string;
  shipping_line_logo: string | null;
  vessel_name: string;
  vessel_logo: string | null;
  loa_m: string | null;
  eta: string | null;
  etd: string | null;
};

function matchesOneStatus(
  call: Pick<AvailabilityCall, "status">,
  callDate: string,
  status: BookingListStatusFilter | string,
  todayIso: string,
): boolean {
  const code = call.status ?? "";
  if (status === "completed") {
    if (code === "c") return false;
    if (code === "r") return true;
    return (
      callDate < todayIso && ACTIVE_STATUSES.includes(code as BookingStatus)
    );
  }
  if (status === "action") {
    return (code === "nr" || code === "h") && callDate >= todayIso;
  }
  return code === status;
}

/** Whether a call matches any selected availability status filter. */
export function availabilityCallMatchesStatus(
  call: Pick<AvailabilityCall, "status">,
  callDate: string,
  statuses:
    | BookingStatusFilterValue[]
    | BookingListStatusFilter
    | string
    | string[]
    | undefined,
  todayIso = bookingTodayIso(),
): boolean {
  const list = normalizeStatusList(statuses);
  if (list.length === 0) return true;
  return list.some((status) =>
    matchesOneStatus(call, callDate, status, todayIso),
  );
}

function normalizeStatusList(
  statuses:
    | BookingStatusFilterValue[]
    | BookingListStatusFilter
    | string
    | string[]
    | undefined,
): string[] {
  if (statuses == null || statuses === "") return [];
  if (Array.isArray(statuses)) {
    return statuses.filter((s): s is string => Boolean(s));
  }
  return [statuses];
}

export function filterAvailabilityCalls<T extends AvailabilityCall>(
  calls: T[],
  callDate: string,
  statuses:
    | BookingStatusFilterValue[]
    | BookingListStatusFilter
    | string
    | string[]
    | undefined,
  todayIso = bookingTodayIso(),
): T[] {
  const list = normalizeStatusList(statuses);
  if (list.length === 0) return calls;
  return calls.filter((call) =>
    availabilityCallMatchesStatus(call, callDate, list, todayIso),
  );
}

/** Distinct ships (booking codes) on a day across all pier columns. */
export function countShipsOnAvailabilityRow(
  cells: AvailabilityCall[][],
  callDate: string,
  statuses?: string[],
  todayIso = bookingTodayIso(),
): number {
  const codes = new Set<string>();
  for (const calls of cells) {
    for (const call of filterAvailabilityCalls(
      calls,
      callDate,
      statuses,
      todayIso,
    )) {
      if (call.booking_code) codes.add(call.booking_code);
    }
  }
  return codes.size;
}
