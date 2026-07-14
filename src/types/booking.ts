import { toIsoDate } from "@/lib/bookingDates";

export type BookingStatus = "requested" | "confirmed" | "cancelled";

export type CancellationReason =
  | "bad_weather"
  | "shipping_line_decision"
  | "itm_decision";

/** List filter: past active bookings (not a stored status). */
export type BookingListStatusFilter = BookingStatus | "" | "completed";

export type BookingBadgeStatus = BookingStatus | "completed";

export type BookingAuditEntry = {
  id: number;
  action: string;
  summary: string;
  changes: Record<string, unknown>;
  user_display: string | null;
  created_at: string;
};

export type Booking = {
  id: number;
  booking_code: string;
  port: number;
  port_code: string;
  port_name: string;
  port_logo: string | null;
  shipping_line: number;
  shipping_line_code: string;
  shipping_line_name: string;
  shipping_line_logo: string | null;
  vessel: number;
  vessel_name: string;
  vessel_logo: string | null;
  position: number | null;
  position_code: string | null;
  call_date: string;
  eta: string | null;
  etd: string | null;
  planned_pax: number | null;
  actual_pax: number | null;
  actual_crew: number | null;
  status: BookingStatus;
  status_display: string;
  notes: string;
  cancellation_reason: CancellationReason | "";
  cancellation_reason_display: string;
  cancellation_evidence_url: string | null;
  confirmation_pdf_url: string | null;
  audit_entries: BookingAuditEntry[];
  created_at: string;
  updated_at: string;
};

export type BookingValidationIssue = {
  level: "error" | "warning";
  code: string;
  message: string;
};

export type BookingValidationResult = {
  valid: boolean;
  errors: BookingValidationIssue[];
  warnings: BookingValidationIssue[];
  by_date: Record<
    string,
    { valid: boolean; errors: BookingValidationIssue[]; warnings: BookingValidationIssue[] }
  >;
};

export type PositionSuggestion = {
  id: number;
  code: string;
  position_type: string;
  max_loa_m: string | null;
  occupied: boolean;
  recommended?: boolean;
  warnings: BookingValidationIssue[];
};

export type BookingBatchPayload = {
  port: number;
  shipping_line: number;
  vessel: number;
  call_dates: string[];
  notes?: string;
};

export type BookingUpdatePayload = {
  status?: BookingStatus;
  position?: number | null;
  eta?: string | null;
  etd?: string | null;
  planned_pax?: number | null;
  actual_pax?: number | null;
  actual_crew?: number | null;
  cancellation_reason?: CancellationReason | null;
  cancellation_evidence?: File | null;
};

export const CANCELLATION_REASON_OPTIONS: {
  value: CancellationReason;
  label: string;
}[] = [
  { value: "bad_weather", label: "Mal tiempo" },
  { value: "shipping_line_decision", label: "Decisión naviera" },
  { value: "itm_decision", label: "Decisión ITM" },
];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  requested: "Solicitada",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};

export const BOOKING_BADGE_STATUS_LABELS: Record<BookingBadgeStatus, string> = {
  ...BOOKING_STATUS_LABELS,
  completed: "Completada",
};

export const BOOKING_STATUS_FILTER_OPTIONS: Array<{
  value: BookingListStatusFilter;
  label: string;
}> = [
  { value: "", label: "Todas" },
  { value: "requested", label: "Solicitadas" },
  { value: "confirmed", label: "Confirmadas" },
  { value: "completed", label: "Completadas" },
  { value: "cancelled", label: "Canceladas" },
];

export function bookingTodayIso(): string {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

export function isBookingCompleted(
  booking: Pick<Booking, "status" | "call_date">,
  todayIso = bookingTodayIso(),
): boolean {
  if (booking.status === "cancelled") return false;
  return booking.call_date < todayIso;
}

export function getBookingBadgeStatus(
  booking: Pick<Booking, "status" | "call_date">,
): BookingBadgeStatus {
  return isBookingCompleted(booking) ? "completed" : booking.status;
}

export function bookingBadgeStatusLabel(status: BookingBadgeStatus): string {
  return BOOKING_BADGE_STATUS_LABELS[status] ?? status;
}

export function bookingStatusLabel(status: BookingStatus): string {
  return BOOKING_STATUS_LABELS[status] ?? status;
}

export function bookingNextStatuses(status: BookingStatus): BookingStatus[] {
  switch (status) {
    case "requested":
      return ["confirmed", "cancelled"];
    case "confirmed":
      return ["cancelled"];
    default:
      return [];
  }
}

export function bookingDetailHref(booking: Pick<Booking, "booking_code">): string {
  return `/bookings/detail?code=${encodeURIComponent(booking.booking_code)}`;
}
