import type { ConflictTypeFilterValue } from "@/lib/bookingConflictLabels";
import {
  conflictChipsFromApi,
  conflictHighlightsFromApi,
  type ConflictDisplaySource,
} from "@/lib/conflictDisplayFromApi";
import type {
  BookingListItem,
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

export type CatalogConflictFocus = {
  has_conflict?: boolean;
  conflict_severity?: "yellow" | "red" | "green";
  conflict_type?: ConflictTypeFilterValue;
};

export type BookingCalendarFocus = CatalogConflictFocus & {
  statuses?: BookingStatusFilterValue[];
  vesselId?: number;
  shippingLineId?: number;
  positionId?: number;
};

/** Soft focus for vessel / shipping-line filters (neighbors stay visible). */
export function bookingMatchesCatalogFocus(
  booking: Pick<BookingListItem, "vessel" | "shipping_line">,
  vesselId: number,
  shippingLineId: number,
): boolean {
  if (vesselId > 0) return booking.vessel === vesselId;
  if (shippingLineId > 0) return booking.shipping_line === shippingLineId;
  return true;
}

export function bookingMatchesConflictFocus(
  source: ConflictDisplaySource,
  focus: CatalogConflictFocus,
): boolean {
  const hasConflictFocus =
    focus.has_conflict !== undefined ||
    Boolean(focus.conflict_severity) ||
    Boolean(focus.conflict_type);
  if (!hasConflictFocus) return true;

  const chips = conflictChipsFromApi(source);
  const highlights = conflictHighlightsFromApi(source);
  const hasConflict =
    chips.length > 0 ||
    Boolean(highlights.frame_card) ||
    Boolean(highlights.severity);

  if (focus.has_conflict === true && !hasConflict) return false;
  if (focus.has_conflict === false && hasConflict) return false;
  if (
    focus.conflict_severity &&
    highlights.severity !== focus.conflict_severity
  ) {
    return false;
  }
  if (
    focus.conflict_type &&
    !chips.some((chip) => chip.type === focus.conflict_type)
  ) {
    return false;
  }
  return true;
}

function matchesOneStatus(
  statusCode: string,
  callDate: string,
  status: BookingListStatusFilter | string,
  todayIso: string,
): boolean {
  if (status === "completed") {
    if (statusCode === "c") return false;
    if (statusCode === "r") return true;
    return (
      callDate < todayIso && ACTIVE_STATUSES.includes(statusCode as BookingStatus)
    );
  }
  if (status === "action") {
    return (statusCode === "nr" || statusCode === "h") && callDate >= todayIso;
  }
  return statusCode === status;
}

export function bookingMatchesStatusFocus(
  booking: Pick<BookingListItem, "status" | "call_date">,
  statuses: BookingStatusFilterValue[] | undefined,
  todayIso = bookingTodayIso(),
): boolean {
  if (!statuses?.length) return true;
  return statuses.some((status) =>
    matchesOneStatus(booking.status, booking.call_date, status, todayIso),
  );
}

/** Calendar soft focus: status, conflict, vessel, line, position — neighbors stay visible. */
export function bookingMatchesCalendarFocus(
  booking: BookingListItem,
  focus: BookingCalendarFocus,
  todayIso = bookingTodayIso(),
): boolean {
  if (!bookingMatchesStatusFocus(booking, focus.statuses, todayIso)) {
    return false;
  }
  if (!bookingMatchesConflictFocus(booking, focus)) {
    return false;
  }
  const vesselId = focus.vesselId && focus.vesselId > 0 ? focus.vesselId : 0;
  if (vesselId > 0 && booking.vessel !== vesselId) return false;
  const lineId =
    focus.shippingLineId && focus.shippingLineId > 0
      ? focus.shippingLineId
      : 0;
  if (vesselId <= 0 && lineId > 0 && booking.shipping_line !== lineId) {
    return false;
  }
  const positionId =
    focus.positionId && focus.positionId > 0 ? focus.positionId : 0;
  if (positionId > 0 && booking.position !== positionId) return false;
  return true;
}
