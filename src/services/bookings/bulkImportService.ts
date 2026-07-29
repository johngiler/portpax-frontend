import { apiFetch } from "@/services/apiClient";

export type BulkImportPreviewRow = {
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

export type BulkImportPreviewResponse = {
  rows: BulkImportPreviewRow[];
  total: number;
  selectable_count: number;
};

export type BulkImportCreateRow = {
  id: string;
  port_id: number;
  shipping_line_id: number;
  vessel_id: number;
  call_date: string;
  eta: string;
  etd: string;
};

export type BulkImportCreateResponse = {
  created_count: number;
  failed_count: number;
  created: { id: string; booking_id: number; booking_code: string }[];
  failures: { id: string; detail: string }[];
};

const BASE = "api/bookings/";

export async function previewBulkBookingImport(
  file: File,
): Promise<BulkImportPreviewResponse> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<BulkImportPreviewResponse>(`${BASE}bulk-import/preview/`, {
    method: "POST",
    body: form,
  });
}

export async function previewBulkBookingImportFromPaste(
  text: string,
): Promise<BulkImportPreviewResponse> {
  return apiFetch<BulkImportPreviewResponse>(`${BASE}bulk-import/preview/`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function createBulkBookingImport(
  rows: BulkImportCreateRow[],
): Promise<BulkImportCreateResponse> {
  return apiFetch<BulkImportCreateResponse>(`${BASE}bulk-import/create/`, {
    method: "POST",
    body: JSON.stringify({ rows }),
  });
}

export type AvailabilityListFilterRow = {
  row_number: number;
  call_date: string;
};

export type AvailabilityListFilterResponse = {
  rows: AvailabilityListFilterRow[];
  dates: string[];
  date_from: string;
  date_to: string;
  total: number;
};

export async function previewAvailabilityListFilter(
  file: File,
): Promise<AvailabilityListFilterResponse> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<AvailabilityListFilterResponse>(
    `${BASE}bulk-import/availability-filter/`,
    {
      method: "POST",
      body: form,
    },
  );
}

export async function previewAvailabilityListFilterFromPaste(
  text: string,
): Promise<AvailabilityListFilterResponse> {
  return apiFetch<AvailabilityListFilterResponse>(
    `${BASE}bulk-import/availability-filter/`,
    {
      method: "POST",
      body: JSON.stringify({ text }),
    },
  );
}
