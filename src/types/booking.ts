export type BookingStatus = "requested" | "confirmed" | "cancelled";

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
  vessel: number;
  vessel_name: string;
  call_date: string;
  status: BookingStatus;
  status_display: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type BookingBatchPayload = {
  port: number;
  shipping_line: number;
  vessel: number;
  call_dates: string[];
  notes?: string;
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
