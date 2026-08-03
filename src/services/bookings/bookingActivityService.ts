import { apiFetch } from "@/services/apiClient";

export type BookingActivityKind = "all" | "single" | "bulk";

export type BookingActivityItem = {
  kind: "single" | "bulk";
  action: string;
  occurred_at: string;
  user_display: string | null;
  summary: string;
  booking_id: number | null;
  booking_code: string | null;
  batch_id: number | null;
  created_count: number | null;
  failed_count: number | null;
  not_created_count?: number | null;
  label?: string;
  changes?: Record<string, unknown> | null;
  entity?: Record<string, unknown> | null;
};

export type BookingActivityResponse = {
  count: number;
  page: number;
  page_size: number;
  results: BookingActivityItem[];
};

export type ImportBatchCreatedItem = {
  id: number;
  booking_code: string;
};

export type ImportBatchFailure = {
  row_id?: string | number | null;
  detail: string;
  ship?: string;
  port?: string;
  call_date?: string;
};

export type ImportBatchRetryRow = {
  id: string;
  row_number: number;
  ship: string;
  port_raw: string;
  vendor_name: string;
  call_type: string;
  call_date: string | null;
  eta: string | null;
  etd: string | null;
  port_id: number | null;
  port_name: string | null;
  port_code: string | null;
  vessel_id: number | null;
  vessel_name: string | null;
  shipping_line_id: number | null;
  shipping_line_name: string | null;
  issues: string[];
  warnings: string[];
  selectable: boolean;
  selected_default: boolean;
};

export type ImportBatchDetail = {
  id: number;
  label: string;
  source: string;
  status: string;
  created_at: string;
  finished_at: string | null;
  user_display: string | null;
  requested_count: number;
  created_count: number;
  failed_count: number;
  not_created_count: number;
  created: ImportBatchCreatedItem[];
  failures: ImportBatchFailure[];
  retry_rows: ImportBatchRetryRow[];
  retry_count: number;
};

const BASE = "api/bookings/";

export async function fetchBookingActivity(params: {
  page?: number;
  page_size?: number;
  kind?: BookingActivityKind;
  date_from?: string;
  date_to?: string;
}): Promise<BookingActivityResponse> {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  if (params.kind && params.kind !== "all") sp.set("kind", params.kind);
  if (params.date_from) sp.set("date_from", params.date_from);
  if (params.date_to) sp.set("date_to", params.date_to);
  const qs = sp.toString();
  return apiFetch<BookingActivityResponse>(
    `${BASE}activity/${qs ? `?${qs}` : ""}`,
  );
}

export async function fetchImportBatchDetail(
  batchId: number,
): Promise<ImportBatchDetail> {
  return apiFetch<ImportBatchDetail>(`${BASE}import-batches/${batchId}/`);
}
