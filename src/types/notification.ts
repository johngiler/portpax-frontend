import type { BookingActivityFilterValue } from "@/lib/bookingActivityTaxonomy";

export type NotificationTarget = "booking_detail" | "bookings_history";

export type NotificationEvent =
  | "created"
  | "updated"
  | "deleted"
  | "conflict_detected"
  | "conflict_resolved"
  | "conflict_updated";

export type AppNotification = {
  id: number;
  event: NotificationEvent;
  artifact: string;
  target: NotificationTarget;
  message: string;
  actor_display: string;
  booking_id: number | null;
  booking_code: string;
  port_id: number | null;
  batch_id: number | null;
  affected_count: number;
  history_type_filter: string;
  read_at: string | null;
  is_read: boolean;
  created_at: string;
};

export type NotificationListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AppNotification[];
};

export type NotificationHistoryParams = {
  typeFilter?: BookingActivityFilterValue;
  batchId?: number | null;
};
