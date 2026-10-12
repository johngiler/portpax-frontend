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
  CancellationReason,
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
  first_arrival?: boolean;
  cancellation_reason?: CancellationReason | "";
};

export type BookingCalendarFocus = CatalogConflictFocus & {
  statuses?: BookingStatusFilterValue[];
  vesselId?: number;
  /** @deprecated Prefer shippingLineIds. */
  shippingLineId?: number;
  shippingLineIds?: number[];
  /** @deprecated Prefer shippingLineGroupIds. */
  shippingLineGroupId?: number;
  shippingLineGroupIds?: number[];
  positionId?: number;
  /** Soft-focus: booking must have one of these tag IDs. */
  tagIds?: number[];
  /** Imported discrete dates — soft-focus (neighbors on other days stay muted). */
  callDates?: string[];
};

function focusLineIds(focus: BookingCalendarFocus): number[] {
  if (focus.shippingLineIds && focus.shippingLineIds.length > 0) {
    return focus.shippingLineIds;
  }
  if (focus.shippingLineId && focus.shippingLineId > 0) {
    return [focus.shippingLineId];
  }
  return [];
}

function focusGroupIds(focus: BookingCalendarFocus): number[] {
  if (focus.shippingLineGroupIds && focus.shippingLineGroupIds.length > 0) {
    return focus.shippingLineGroupIds;
  }
  if (focus.shippingLineGroupId && focus.shippingLineGroupId > 0) {
    return [focus.shippingLineGroupId];
  }
  return [];
}

/** Soft focus for vessel / shipping-line filters (neighbors stay visible). */
export function bookingMatchesCatalogFocus(
  booking: Pick<BookingListItem, "vessel" | "shipping_line" | "shipping_line_group">,
  vesselId: number,
  shippingLineIds: number[] | number,
  shippingLineGroupIds: number[] | number = 0,
): boolean {
  if (vesselId > 0) return booking.vessel === vesselId;
  const lines = Array.isArray(shippingLineIds)
    ? shippingLineIds
    : shippingLineIds > 0
      ? [shippingLineIds]
      : [];
  if (lines.length > 0) return lines.includes(booking.shipping_line);
  const groups = Array.isArray(shippingLineGroupIds)
    ? shippingLineGroupIds
    : shippingLineGroupIds > 0
      ? [shippingLineGroupIds]
      : [];
  if (groups.length > 0) {
    return groups.includes(booking.shipping_line_group ?? 0);
  }
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
  const lineIds = focusLineIds(focus);
  if (vesselId <= 0 && lineIds.length > 0) {
    if (!lineIds.includes(booking.shipping_line)) return false;
  }
  const groupIds = focusGroupIds(focus);
  if (vesselId <= 0 && lineIds.length === 0 && groupIds.length > 0) {
    if (!groupIds.includes(booking.shipping_line_group ?? 0)) return false;
  }
  const positionId =
    focus.positionId && focus.positionId > 0 ? focus.positionId : 0;
  if (positionId > 0 && booking.position !== positionId) return false;
  if (focus.tagIds && focus.tagIds.length > 0) {
    const tagId = booking.tag_id ?? 0;
    if (!focus.tagIds.includes(tagId)) return false;
  }
  if (focus.callDates && focus.callDates.length > 0) {
    const allow = new Set(focus.callDates);
    if (!allow.has(booking.call_date)) return false;
  }
  if (focus.first_arrival === true && !booking.first_arrival) return false;
  if (focus.first_arrival === false && booking.first_arrival) return false;
  if (
    focus.cancellation_reason &&
    booking.status === "c" &&
    (booking.cancellation_reason ?? "") !== focus.cancellation_reason
  ) {
    return false;
  }
  return true;
}

/** True when any sidebar soft-focus filter is active. */
export function calendarFocusIsActive(focus: BookingCalendarFocus): boolean {
  return Boolean(
    (focus.statuses && focus.statuses.length > 0) ||
      (focus.vesselId && focus.vesselId > 0) ||
      focusLineIds(focus).length > 0 ||
      focusGroupIds(focus).length > 0 ||
      (focus.positionId && focus.positionId > 0) ||
      (focus.tagIds && focus.tagIds.length > 0) ||
      (focus.callDates && focus.callDates.length > 0) ||
      focus.has_conflict !== undefined ||
      focus.conflict_severity ||
      focus.conflict_type ||
      focus.first_arrival !== undefined ||
      Boolean(focus.cancellation_reason),
  );
}

/**
 * Same-day (or same cell group) bookings: keep neighbors only when at least
 * one booking matches the focus. Orphan non-matches are dropped.
 */
export function bookingsWithFocusNeighbors(
  bookings: BookingListItem[],
  focus: BookingCalendarFocus,
  todayIso = bookingTodayIso(),
): BookingListItem[] {
  if (!calendarFocusIsActive(focus)) return bookings;
  if (
    !bookings.some((b) => bookingMatchesCalendarFocus(b, focus, todayIso))
  ) {
    return [];
  }
  return bookings;
}
