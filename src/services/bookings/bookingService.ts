import { apiFetch, ApiError, type ApiListResponse } from "@/services/apiClient";
import type { Booking, BookingBatchPayload, BookingStatus } from "@/types/booking";

const BASE = "api/bookings/";

export type FetchBookingsParams = {
  page?: number;
  search?: string;
  port?: number;
  shipping_line?: number;
  vessel?: number;
  status?: BookingStatus | "";
};

export async function fetchBookings(
  params: FetchBookingsParams = {},
): Promise<ApiListResponse<Booking>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.port) query.set("port", String(params.port));
  if (params.shipping_line) query.set("shipping_line", String(params.shipping_line));
  if (params.vessel) query.set("vessel", String(params.vessel));
  if (params.status) query.set("status", params.status);
  const qs = query.toString();
  return apiFetch<ApiListResponse<Booking>>(`${BASE}${qs ? `?${qs}` : ""}`);
}

export async function fetchBooking(id: number): Promise<Booking> {
  return apiFetch<Booking>(`${BASE}${id}/`);
}

export async function fetchBookingByCode(code: string): Promise<Booking> {
  const trimmed = code.trim();
  const data = await fetchBookings({ search: trimmed, page: 1 });
  const match =
    data.results.find((booking) => booking.booking_code === trimmed) ??
    data.results.find((booking) => booking.booking_code.includes(trimmed));
  if (!match) {
    throw new ApiError("Reserva no encontrada.", 404);
  }
  return fetchBooking(match.id);
}

export async function createBookingBatch(payload: BookingBatchPayload): Promise<Booking[]> {
  return apiFetch<Booking[]>(`${BASE}batch/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateBookingStatus(id: number, status: BookingStatus): Promise<Booking> {
  return apiFetch<Booking>(`${BASE}${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
