import {
  bookingMatchesConflictFocus,
  type CatalogConflictFocus,
} from "@/lib/bookingCatalogFocus";
import type {
  BookingListStatusFilter,
  BookingStatus,
  BookingStatusFilterValue,
} from "@/types/booking";
import { bookingTodayIso } from "@/types/booking";
import type { ConflictDisplaySource } from "@/lib/conflictDisplayFromApi";

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
  shipping_line_id?: number;
  shipping_line_name: string;
  shipping_line_logo: string | null;
  vessel_id?: number;
  vessel_name: string;
  vessel_logo: string | null;
  loa_m: string | null;
  eta: string | null;
  etd: string | null;
} & ConflictDisplaySource;

export type AvailabilityFocusFilters = CatalogConflictFocus & {
  statuses?:
    | BookingStatusFilterValue[]
    | BookingListStatusFilter
    | string
    | string[]
    | undefined;
  vesselId?: number;
  shippingLineId?: number;
  positionId?: number;
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

/** Sidebar focus filters — neighbors stay visible (muted). */
export function availabilityCallMatchesFocus(
  call: Pick<
    AvailabilityCall,
    | "status"
    | "vessel_id"
    | "shipping_line_id"
    | "position_id"
    | "conflict_chips"
    | "conflict_highlights"
  >,
  callDate: string,
  focus: AvailabilityFocusFilters,
  todayIso = bookingTodayIso(),
): boolean {
  if (
    !availabilityCallMatchesStatus(call, callDate, focus.statuses, todayIso)
  ) {
    return false;
  }
  if (!bookingMatchesConflictFocus(call, focus)) {
    return false;
  }
  const vesselId = focus.vesselId && focus.vesselId > 0 ? focus.vesselId : 0;
  if (vesselId > 0 && (call.vessel_id ?? 0) !== vesselId) {
    return false;
  }
  const lineId =
    focus.shippingLineId && focus.shippingLineId > 0
      ? focus.shippingLineId
      : 0;
  if (vesselId <= 0 && lineId > 0 && (call.shipping_line_id ?? 0) !== lineId) {
    return false;
  }
  const positionId =
    focus.positionId && focus.positionId > 0 ? focus.positionId : 0;
  if (positionId > 0 && (call.position_id ?? 0) !== positionId) {
    return false;
  }
  return true;
}

export function availabilityFocusNeighborTitle(
  call: Pick<
    AvailabilityCall,
    | "status"
    | "vessel_id"
    | "shipping_line_id"
    | "position_id"
    | "booking_code"
    | "conflict_chips"
    | "conflict_highlights"
  >,
  callDate: string,
  focus: AvailabilityFocusFilters,
  todayIso = bookingTodayIso(),
): string {
  if (
    !availabilityCallMatchesStatus(call, callDate, focus.statuses, todayIso)
  ) {
    return `${call.booking_code} · otro estado (vecino)`;
  }
  if (!bookingMatchesConflictFocus(call, focus)) {
    return `${call.booking_code} · otro conflicto (vecino)`;
  }
  const vesselId = focus.vesselId && focus.vesselId > 0 ? focus.vesselId : 0;
  if (vesselId > 0 && (call.vessel_id ?? 0) !== vesselId) {
    return `${call.booking_code} · otro barco (vecino)`;
  }
  const lineId =
    focus.shippingLineId && focus.shippingLineId > 0
      ? focus.shippingLineId
      : 0;
  if (vesselId <= 0 && lineId > 0 && (call.shipping_line_id ?? 0) !== lineId) {
    return `${call.booking_code} · otra naviera (vecino)`;
  }
  const positionId =
    focus.positionId && focus.positionId > 0 ? focus.positionId : 0;
  if (positionId > 0 && (call.position_id ?? 0) !== positionId) {
    return `${call.booking_code} · otra posición (vecino)`;
  }
  return call.booking_code;
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
