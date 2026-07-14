import { fetchAllPages } from "@/lib/fetchAllPages";
import {
  apiDownload,
  apiFetch,
  ApiError,
  triggerBrowserDownload,
  type ApiListResponse,
} from "@/services/apiClient";
import type {
  Booking,
  BookingBatchPayload,
  BookingListStatusFilter,
  BookingStatus,
  BookingUpdatePayload,
  BookingValidationResult,
  PositionSuggestion,
} from "@/types/booking";

const BASE = "api/bookings/";

export type FetchBookingsParams = {
  page?: number;
  search?: string;
  port?: number;
  shipping_line?: number;
  vessel?: number;
  status?: BookingListStatusFilter;
  call_date_from?: string;
  call_date_to?: string;
  ordering?: string;
  pageSize?: number;
};

function bookingsQuery(params: FetchBookingsParams = {}): URLSearchParams {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.port) query.set("port", String(params.port));
  if (params.shipping_line) query.set("shipping_line", String(params.shipping_line));
  if (params.vessel) query.set("vessel", String(params.vessel));
  if (params.status) query.set("status", params.status);
  if (params.call_date_from) query.set("call_date_from", params.call_date_from);
  if (params.call_date_to) query.set("call_date_to", params.call_date_to);
  if (params.ordering) query.set("ordering", params.ordering);
  if (params.pageSize) query.set("page_size", String(params.pageSize));
  return query;
}

export async function fetchBookings(
  params: FetchBookingsParams = {},
): Promise<ApiListResponse<Booking>> {
  const qs = bookingsQuery(params).toString();
  return apiFetch<ApiListResponse<Booking>>(`${BASE}${qs ? `?${qs}` : ""}`);
}

export async function exportBookingsReport(
  params: Omit<FetchBookingsParams, "page" | "pageSize"> & {
    exportFormat: "xlsx" | "csv";
  },
): Promise<void> {
  const query = bookingsQuery(params);
  // Do not use query key "format" — DRF content negotiation returns 404 for xlsx.
  query.set("export_format", params.exportFormat);
  const { blob, filename } = await apiDownload(`${BASE}export/?${query.toString()}`);
  const fallback = `reservas.${params.exportFormat}`;
  triggerBrowserDownload(blob, filename || fallback);
}

export async function fetchAllBookings(
  params: Omit<FetchBookingsParams, "page"> = {},
): Promise<Booking[]> {
  return fetchAllPages((page, pageSize) => fetchBookings({ ...params, page, pageSize }));
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

export async function validateBookings(params: {
  port: number;
  vessel: number;
  call_dates: string[];
  position?: number | null;
}): Promise<BookingValidationResult> {
  return apiFetch<BookingValidationResult>(`${BASE}validate/`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function suggestBookingPositions(params: {
  port: number;
  vessel: number;
  call_date: string;
}): Promise<{ positions: PositionSuggestion[] }> {
  const query = new URLSearchParams({
    port: String(params.port),
    vessel: String(params.vessel),
    call_date: params.call_date,
  });
  return apiFetch<{ positions: PositionSuggestion[] }>(
    `${BASE}suggest-positions/?${query.toString()}`,
  );
}

export function pickRecommendedPosition(
  positions: PositionSuggestion[],
): PositionSuggestion | null {
  return (
    positions.find((position) => position.recommended) ??
    positions.find((position) => !position.occupied) ??
    null
  );
}

export async function previewAssignedPositions(params: {
  port: number;
  vessel: number;
  call_dates: string[];
}): Promise<Record<string, PositionSuggestion | null>> {
  const entries = await Promise.all(
    params.call_dates.map(async (call_date) => {
      const { positions } = await suggestBookingPositions({
        port: params.port,
        vessel: params.vessel,
        call_date,
      });
      return [call_date, pickRecommendedPosition(positions)] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export async function updateBooking(id: number, payload: BookingUpdatePayload): Promise<Booking> {
  const hasFile = payload.cancellation_evidence instanceof File;

  if (hasFile) {
    const form = new FormData();
    if (payload.status) form.set("status", payload.status);
    if (payload.cancellation_reason) {
      form.set("cancellation_reason", payload.cancellation_reason);
    }
    if (payload.cancellation_evidence) {
      form.set("cancellation_evidence", payload.cancellation_evidence);
    }
    return apiFetch<Booking>(`${BASE}${id}/`, { method: "PATCH", body: form });
  }

  const body: Record<string, unknown> = {};
  if (payload.status !== undefined) body.status = payload.status;
  if (payload.position !== undefined) body.position = payload.position;
  if (payload.eta !== undefined) body.eta = payload.eta;
  if (payload.etd !== undefined) body.etd = payload.etd;
  if (payload.planned_pax !== undefined) body.planned_pax = payload.planned_pax;
  if (payload.actual_pax !== undefined) body.actual_pax = payload.actual_pax;
  if (payload.actual_crew !== undefined) body.actual_crew = payload.actual_crew;
  if (payload.cancellation_reason !== undefined) {
    body.cancellation_reason = payload.cancellation_reason;
  }

  return apiFetch<Booking>(`${BASE}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function updateBookingStatus(id: number, status: BookingStatus): Promise<Booking> {
  return updateBooking(id, { status });
}

export async function deleteBooking(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}${id}/`, { method: "DELETE" });
}

export type FetchDashboardStatsParams = {
  date_from: string;
  date_to: string;
  port?: number;
  shipping_line?: number;
  shipping_line_group?: number;
};

export async function fetchDashboardStats(
  params: FetchDashboardStatsParams,
): Promise<import("@/types/dashboard").DashboardStats> {
  const query = new URLSearchParams();
  query.set("date_from", params.date_from);
  query.set("date_to", params.date_to);
  if (params.port) query.set("port", String(params.port));
  if (params.shipping_line) query.set("shipping_line", String(params.shipping_line));
  if (params.shipping_line_group) {
    query.set("shipping_line_group", String(params.shipping_line_group));
  }
  return apiFetch(`${BASE}dashboard-stats/?${query.toString()}`);
}
