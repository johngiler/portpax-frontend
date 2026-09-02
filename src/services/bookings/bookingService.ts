import { fetchAllPages } from "@/lib/fetchAllPages";
import type { ConflictTypeFilterValue } from "@/lib/bookingConflictLabels";
import {
  apiDownload,
  apiFetch,
  ApiError,
  triggerBrowserDownload,
  type ApiListResponse,
} from "@/services/apiClient";
import type {
  Booking,
  BookingListItem,
  BookingConflictChip,
  BookingConflictHighlights,
  BookingBatchPayload,
  BookingListStatusFilter,
  BookingStatus,
  BookingStatusFilterValue,
  BookingUpdatePayload,
  BookingValidationResult,
  PositionSuggestion,
} from "@/types/booking";
import { serializeBookingStatusFilters } from "@/types/booking";

const BASE = "api/bookings/";

export type AvailabilityBookingCall = {
  booking_code: string;
  status?: string;
  conflict_chips?: BookingConflictChip[];
  conflict_highlights?: BookingConflictHighlights;
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
  actual_pax: number | null;
  planned_pax: number | null;
};

export type FetchBookingsParams = {
  page?: number;
  search?: string;
  port?: number;
  /** Multi-port filter (CSV on `port` query param). Wins over `port` when set. */
  ports?: number[];
  position?: number;
  shipping_line?: number;
  vessel?: number;
  long_term_agreement?: number;
  /** @deprecated Prefer `statuses` multi-select. */
  status?: BookingListStatusFilter;
  statuses?: BookingStatusFilterValue[];
  call_date_from?: string;
  call_date_to?: string;
  /** Discrete ISO dates (imported list); intersects with from/to when both set. */
  call_dates?: string[];
  ordering?: string;
  pageSize?: number;
  /** true = only conflicted; false = only clean; omit = all */
  has_conflict?: boolean;
  /** Filter by persisted conflict_severity (yellow|red). */
  conflict_severity?: "yellow" | "red" | "green";
  /** Filter by operational conflict type group. */
  conflict_type?: ConflictTypeFilterValue;
};

function bookingsQuery(params: FetchBookingsParams = {}): URLSearchParams {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.ports && params.ports.length > 0) {
    query.set("port", params.ports.join(","));
  } else if (params.port) {
    query.set("port", String(params.port));
  }
  if (params.position) query.set("position", String(params.position));
  if (params.shipping_line) query.set("shipping_line", String(params.shipping_line));
  if (params.vessel) query.set("vessel", String(params.vessel));
  if (params.long_term_agreement) {
    query.set("long_term_agreement", String(params.long_term_agreement));
  }
  const statusCsv =
    params.statuses && params.statuses.length > 0
      ? serializeBookingStatusFilters(params.statuses)
      : params.status || "";
  if (statusCsv) query.set("status", statusCsv);
  if (params.call_date_from) query.set("call_date_from", params.call_date_from);
  if (params.call_date_to) query.set("call_date_to", params.call_date_to);
  if (params.call_dates && params.call_dates.length > 0) {
    query.set("call_dates", params.call_dates.join(","));
  }
  if (params.ordering) query.set("ordering", params.ordering);
  if (params.pageSize) query.set("page_size", String(params.pageSize));
  if (params.has_conflict === true) query.set("has_conflict", "true");
  if (params.has_conflict === false) query.set("has_conflict", "false");
  if (params.conflict_severity) {
    query.set("conflict_severity", params.conflict_severity);
  }
  if (params.conflict_type) {
    query.set("conflict_type", params.conflict_type);
  }
  return query;
}

export async function fetchBookings(
  params: FetchBookingsParams = {},
): Promise<ApiListResponse<BookingListItem>> {
  const qs = bookingsQuery(params).toString();
  return apiFetch<ApiListResponse<BookingListItem>>(`${BASE}${qs ? `?${qs}` : ""}`);
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
): Promise<BookingListItem[]> {
  return fetchAllPages((page, pageSize) => fetchBookings({ ...params, page, pageSize }));
}

export async function exportCalendarReport(
  params: {
    ports: number[];
    call_date_from: string;
    call_date_to: string;
    shipping_line?: number;
    status?: BookingListStatusFilter;
    statuses?: BookingStatusFilterValue[];
    exportFormat: "xlsx" | "csv";
  },
): Promise<void> {
  const query = new URLSearchParams();
  query.set("port", params.ports.join(","));
  query.set("call_date_from", params.call_date_from);
  query.set("call_date_to", params.call_date_to);
  query.set("export_format", params.exportFormat);
  if (params.shipping_line) query.set("shipping_line", String(params.shipping_line));
  const statusCsv =
    params.statuses && params.statuses.length > 0
      ? serializeBookingStatusFilters(params.statuses)
      : params.status || "";
  if (statusCsv) query.set("status", statusCsv);
  const { blob, filename } = await apiDownload(
    `${BASE}calendar-export/?${query.toString()}`,
  );
  triggerBrowserDownload(blob, filename || `calendario.${params.exportFormat}`);
}

export type StructuredReportType =
  | "availability"
  | "ports_totals_matrix"
  | "port_carrier_matrix"
  | "port_trends";

export type MatrixYearRow = {
  year: number | "total";
  months: number[];
  total: number;
  is_total?: boolean;
};

export type MatrixSection = {
  label: string;
  calls: MatrixYearRow[];
  pax: MatrixYearRow[];
  is_total?: boolean;
  logo?: string | null;
  logo_kind?: "port" | "shipping_line";
};

export type ReportPagination = {
  page: number;
  page_size: number;
  total_count: number;
  has_more: boolean;
};

export type PortsTotalsMatrixReport = {
  kind: "ports_totals";
  title: string;
  date_from: string;
  date_to: string;
  without_lta: boolean;
  pax_basis?: "planned" | "capacity";
  month_labels: string[];
  years: number[];
  sections: MatrixSection[];
  note: string;
} & ReportPagination;

export type PortCarrierMatrixReport = {
  kind: "port_carrier";
  title: string;
  port: { id: number; code: string; name: string; logo?: string | null };
  date_from: string;
  date_to: string;
  without_lta: boolean;
  pax_basis?: "planned" | "capacity";
  month_labels: string[];
  years: number[];
  sections: MatrixSection[];
  note: string;
} & ReportPagination;

export type PortTrendsReport = {
  kind: "port_trends";
  title: string;
  port: { id: number; code: string; name: string; logo?: string | null };
  date_from: string;
  date_to: string;
  without_lta: boolean;
  pax_basis?: "planned" | "capacity";
  years: number[];
  lines: Array<{
    shipping_line_id: number;
    code: string;
    name: string;
    logo?: string | null;
    by_year: Array<{ year: number; ships: number; pax: number }>;
    growth: Array<{ year: number; pct: number | null }>;
    total_ships: number;
    total_pax: number;
  }>;
  note: string;
} & ReportPagination;

export type AvailabilityReport = {
  port_id: number;
  port_code: string;
  port_name: string;
  date_from: string;
  date_to: string;
  columns: Array<{
    id: number;
    code: string;
    label: string;
    berth_name: string;
    max_loa_m: string | null;
  }>;
  rows: Array<{
    date: string;
    cells: Array<Array<AvailabilityBookingCall>>;
  }>;
  /** Present when ships_per_day filter is applied (server-paged matching days). */
  ships_per_day?: number;
  matched_days?: number;
  page?: number;
  page_size?: number;
  has_more?: boolean;
};

export async function fetchAvailabilityReport(params: {
  date_from: string;
  date_to: string;
  port: number;
  shipping_line?: number;
  vessel?: number;
  position?: number;
  status?: string;
  statuses?: string[];
  /** Exact distinct ships on that day (1–4); enables server pagination. */
  ships_per_day?: number;
  /** Only days with ≥1 call (occupancy criterion); enables server pagination. */
  occupied_only?: boolean;
  page?: number;
  page_size?: number;
  has_conflict?: boolean;
  conflict_severity?: "yellow" | "red" | "green";
  conflict_type?: ConflictTypeFilterValue;
}): Promise<AvailabilityReport> {
  const query = new URLSearchParams();
  query.set("date_from", params.date_from);
  query.set("date_to", params.date_to);
  query.set("port", String(params.port));
  if (params.shipping_line) {
    query.set("shipping_line", String(params.shipping_line));
  }
  if (params.vessel) query.set("vessel", String(params.vessel));
  if (params.position) query.set("position", String(params.position));
  const statusCsv =
    params.statuses && params.statuses.length > 0
      ? params.statuses.join(",")
      : params.status || "";
  if (statusCsv) query.set("status", statusCsv);
  if (params.has_conflict === true) query.set("has_conflict", "true");
  if (params.has_conflict === false) query.set("has_conflict", "false");
  if (params.conflict_severity) {
    query.set("conflict_severity", params.conflict_severity);
  }
  if (params.conflict_type) {
    query.set("conflict_type", params.conflict_type);
  }
  if (params.ships_per_day != null && params.ships_per_day >= 1) {
    query.set("ships_per_day", String(params.ships_per_day));
  }
  if (params.occupied_only) query.set("occupied_only", "true");
  const paged =
    (params.ships_per_day != null && params.ships_per_day >= 1) ||
    params.occupied_only === true ||
    params.has_conflict !== undefined ||
    Boolean(params.conflict_severity) ||
    Boolean(params.conflict_type) ||
    Boolean(params.shipping_line) ||
    Boolean(params.vessel) ||
    Boolean(params.position) ||
    Boolean(params.statuses?.length) ||
    Boolean(params.status);
  if (paged) {
    if (params.page != null) query.set("page", String(params.page));
    if (params.page_size != null) {
      query.set("page_size", String(params.page_size));
    }
  }
  return apiFetch<AvailabilityReport>(
    `${BASE}report-availability/?${query.toString()}`,
  );
}

export const REPORT_MATRIX_SECTION_PAGE_SIZE = 2;
export const REPORT_TRENDS_LINE_PAGE_SIZE = 10;

export async function fetchPortsTotalsMatrixReport(params: {
  date_from: string;
  date_to: string;
  without_lta?: boolean;
  pax_basis?: "planned" | "capacity";
  page?: number;
  page_size?: number;
}): Promise<PortsTotalsMatrixReport> {
  const query = new URLSearchParams();
  query.set("date_from", params.date_from);
  query.set("date_to", params.date_to);
  if (params.without_lta) query.set("without_lta", "true");
  if (params.pax_basis && params.pax_basis !== "planned") {
    query.set("pax_basis", params.pax_basis);
  }
  if (params.page != null) query.set("page", String(params.page));
  if (params.page_size != null) {
    query.set("page_size", String(params.page_size));
  }
  return apiFetch<PortsTotalsMatrixReport>(
    `${BASE}report-ports-totals-matrix/?${query.toString()}`,
  );
}

export async function fetchPortCarrierMatrixReport(params: {
  date_from: string;
  date_to: string;
  port: number;
  without_lta?: boolean;
  pax_basis?: "planned" | "capacity";
  page?: number;
  page_size?: number;
}): Promise<PortCarrierMatrixReport> {
  const query = new URLSearchParams();
  query.set("date_from", params.date_from);
  query.set("date_to", params.date_to);
  query.set("port", String(params.port));
  if (params.without_lta) query.set("without_lta", "true");
  if (params.pax_basis && params.pax_basis !== "planned") {
    query.set("pax_basis", params.pax_basis);
  }
  if (params.page != null) query.set("page", String(params.page));
  if (params.page_size != null) {
    query.set("page_size", String(params.page_size));
  }
  return apiFetch<PortCarrierMatrixReport>(
    `${BASE}report-port-carrier-matrix/?${query.toString()}`,
  );
}

export async function fetchPortTrendsReport(params: {
  date_from: string;
  date_to: string;
  port: number;
  without_lta?: boolean;
  pax_basis?: "planned" | "capacity";
  page?: number;
  page_size?: number;
}): Promise<PortTrendsReport> {
  const query = new URLSearchParams();
  query.set("date_from", params.date_from);
  query.set("date_to", params.date_to);
  query.set("port", String(params.port));
  if (params.without_lta) query.set("without_lta", "true");
  if (params.pax_basis && params.pax_basis !== "planned") {
    query.set("pax_basis", params.pax_basis);
  }
  if (params.page != null) query.set("page", String(params.page));
  if (params.page_size != null) {
    query.set("page_size", String(params.page_size));
  }
  return apiFetch<PortTrendsReport>(
    `${BASE}report-port-trends/?${query.toString()}`,
  );
}

export async function exportStructuredReport(params: {
  report_type: StructuredReportType;
  date_from: string;
  date_to: string;
  port?: number;
  shipping_line?: number;
  vessel?: number;
  position?: number;
  status?: string;
  statuses?: string[];
  without_lta?: boolean;
  pax_basis?: "planned" | "capacity";
  exportFormat?: "xlsx" | "csv";
}): Promise<void> {
  const format = params.exportFormat ?? "xlsx";
  const query = new URLSearchParams();
  query.set("report_type", params.report_type);
  query.set("date_from", params.date_from);
  query.set("date_to", params.date_to);
  query.set("export_format", format);
  if (params.port) query.set("port", String(params.port));
  if (params.shipping_line) query.set("shipping_line", String(params.shipping_line));
  if (params.vessel) query.set("vessel", String(params.vessel));
  if (params.position) query.set("position", String(params.position));
  if (params.without_lta) query.set("without_lta", "true");
  if (params.pax_basis && params.pax_basis !== "planned") {
    query.set("pax_basis", params.pax_basis);
  }
  const statusCsv =
    params.statuses && params.statuses.length > 0
      ? params.statuses.join(",")
      : params.status || "";
  if (statusCsv) query.set("status", statusCsv);
  const { blob, filename } = await apiDownload(
    `${BASE}report-export/?${query.toString()}`,
  );
  triggerBrowserDownload(blob, filename || `${params.report_type}.${format}`);
}

export async function fetchBooking(id: number): Promise<Booking> {
  return apiFetch<Booking>(`${BASE}${id}/`);
}

export async function fetchBookingByCode(code: string): Promise<Booking> {
  const trimmed = code.trim();
  if (!trimmed) {
    throw new ApiError("Reserva no encontrada.", 404);
  }
  return apiFetch<Booking>(`${BASE}by-code/${encodeURIComponent(trimmed)}/`);
}

export async function createBookingBatch(
  payload: BookingBatchPayload,
): Promise<BookingListItem[]> {
  return apiFetch<BookingListItem[]>(`${BASE}batch/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function validateBookings(params: {
  port: number;
  vessel: number;
  call_dates: string[];
  position?: number | null;
  eta?: string | null;
  etd?: string | null;
  acknowledge_combined_red?: boolean;
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
  /** When reassigning an existing booking, omit it from occupancy. */
  exclude_booking?: number;
  /** Enables schedule rules (FILO, overlap) in suggestion warnings. */
  eta?: string | null;
  etd?: string | null;
}): Promise<{ positions: PositionSuggestion[] }> {
  const query = new URLSearchParams({
    port: String(params.port),
    vessel: String(params.vessel),
    call_date: params.call_date,
  });
  if (params.exclude_booking != null) {
    query.set("exclude_booking", String(params.exclude_booking));
  }
  if (params.eta) query.set("eta", params.eta);
  if (params.etd) query.set("etd", params.etd);
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
  const hasFile =
    payload.cancellation_evidence instanceof File ||
    payload.arrival_manifest instanceof File;

  if (hasFile) {
    const form = new FormData();
    if (payload.status) form.set("status", payload.status);
    if (payload.cancellation_reason) {
      form.set("cancellation_reason", payload.cancellation_reason);
    }
    if (payload.cancellation_evidence) {
      form.set("cancellation_evidence", payload.cancellation_evidence);
    }
    if (payload.arrival_manifest) {
      form.set("arrival_manifest", payload.arrival_manifest);
    }
    if (payload.actual_pax !== undefined && payload.actual_pax !== null) {
      form.set("actual_pax", String(payload.actual_pax));
    }
    if (payload.actual_crew !== undefined && payload.actual_crew !== null) {
      form.set("actual_crew", String(payload.actual_crew));
    }
    if (payload.eta_real !== undefined) {
      form.set("eta_real", payload.eta_real ?? "");
    }
    if (payload.etd_real !== undefined) {
      form.set("etd_real", payload.etd_real ?? "");
    }
    if (payload.notes !== undefined) {
      form.set("notes", payload.notes);
    }
    if (payload.operation_notes !== undefined) {
      form.set("operation_notes", payload.operation_notes);
    }
    if (payload.position !== undefined) {
      form.set("position", payload.position == null ? "" : String(payload.position));
    }
    if (payload.eta !== undefined) form.set("eta", payload.eta ?? "");
    if (payload.etd !== undefined) form.set("etd", payload.etd ?? "");
    return apiFetch<Booking>(`${BASE}${id}/`, { method: "PATCH", body: form });
  }

  const body: Record<string, unknown> = {};
  if (payload.status !== undefined) body.status = payload.status;
  if (payload.position !== undefined) body.position = payload.position;
  if (payload.eta !== undefined) body.eta = payload.eta;
  if (payload.etd !== undefined) body.etd = payload.etd;
  if (payload.eta_real !== undefined) body.eta_real = payload.eta_real;
  if (payload.etd_real !== undefined) body.etd_real = payload.etd_real;
  if (payload.planned_pax !== undefined) body.planned_pax = payload.planned_pax;
  if (payload.actual_pax !== undefined) body.actual_pax = payload.actual_pax;
  if (payload.actual_crew !== undefined) body.actual_crew = payload.actual_crew;
  if (payload.port !== undefined) body.port = payload.port;
  if (payload.shipping_line !== undefined) body.shipping_line = payload.shipping_line;
  if (payload.vessel !== undefined) body.vessel = payload.vessel;
  if (payload.call_date !== undefined) body.call_date = payload.call_date;
  if (payload.notes !== undefined) body.notes = payload.notes;
  if (payload.operation_notes !== undefined) {
    body.operation_notes = payload.operation_notes;
  }
  if (payload.cancellation_reason !== undefined) {
    body.cancellation_reason = payload.cancellation_reason;
  }
  if (payload.port_operator_override !== undefined) {
    body.port_operator_override = payload.port_operator_override;
  }
  if (payload.acknowledge_combined_red !== undefined) {
    body.acknowledge_combined_red = payload.acknowledge_combined_red;
  }
  if (payload.override_reason !== undefined) {
    body.override_reason = payload.override_reason;
  }

  return apiFetch<Booking>(`${BASE}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export type PlannedPaxPreview = {
  planned_pax: number | null;
  capacity: number | null;
  sample_count: number;
  source: "average" | "capacity" | "none" | string;
  pct_of_capacity: number | null;
};

export async function fetchPlannedPaxPreview(params: {
  vessel: number;
  excludeBooking?: number;
}): Promise<PlannedPaxPreview> {
  const query = new URLSearchParams();
  query.set("vessel", String(params.vessel));
  if (params.excludeBooking) {
    query.set("exclude_booking", String(params.excludeBooking));
  }
  return apiFetch<PlannedPaxPreview>(`${BASE}planned-pax-preview/?${query}`);
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
