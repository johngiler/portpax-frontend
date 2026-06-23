export type BookingStatus = "requested" | "confirmed" | "cancelled";

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
  folio: string | null;
  port: number;
  port_code: string;
  port_name: string;
  port_logo: string | null;
  shipping_line: number;
  shipping_line_code: string;
  shipping_line_name: string;
  vessel: number;
  vessel_name: string;
  position: number | null;
  position_code: string | null;
  call_date: string;
  eta: string | null;
  etd: string | null;
  planned_pax: number | null;
  actual_pax: number | null;
  status: BookingStatus;
  status_display: string;
  notes: string;
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
  cancellation_evidence?: File | null;
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  requested: "Solicitada",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};

export const BOOKING_STATUS_FILTER_OPTIONS: Array<{
  value: BookingStatus | "";
  label: string;
}> = [
  { value: "", label: "Todas" },
  { value: "requested", label: "Solicitadas" },
  { value: "confirmed", label: "Confirmadas" },
  { value: "cancelled", label: "Canceladas" },
];

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
