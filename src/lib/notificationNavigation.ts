import type { BookingActivityFilterValue } from "@/lib/bookingActivityTaxonomy";
import { bookingDetailHref } from "@/types/booking";
import type { AppNotification } from "@/types/notification";

export function notificationHref(notification: AppNotification): string {
  if (
    notification.target === "booking_detail" &&
    notification.booking_code
  ) {
    return bookingDetailHref({ booking_code: notification.booking_code });
  }

  const params = new URLSearchParams();
  params.set("openHistory", "1");
  if (notification.history_type_filter) {
    params.set(
      "historyType",
      notification.history_type_filter,
    );
  }
  if (notification.batch_id != null) {
    params.set("historyBatch", String(notification.batch_id));
  }
  return `/bookings?${params.toString()}`;
}

export function parseHistoryTypeParam(
  raw: string | null,
): BookingActivityFilterValue {
  if (!raw) return "";
  const allowed = new Set([
    "",
    "create",
    "create:wizard",
    "create:mass_import",
    "create:lta_generate",
    "create:berthing_import",
    "update",
    "update:booking_update",
    "update:mass_update",
    "update:lta_agreement",
    "delete",
  ]);
  return allowed.has(raw) ? (raw as BookingActivityFilterValue) : "";
}
