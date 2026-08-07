import { apiDownload, apiFetch, triggerBrowserDownload } from "@/services/apiClient";
import type { PositionOccupant } from "@/types/booking";

export type BulkImportLtaCandidate = {
  id: number;
  booking_code: string;
  status?: string;
  vessel_name: string;
  shipping_line_name?: string;
  position_id: number | null;
  position_code: string | null;
};

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
  /** Initial booking status for create (Hold default; no NR/C/R). */
  suggested_status?: "h" | "co" | "cl" | "lta" | "ltd";
  position_id?: number | null;
  position_code?: string | null;
  /** Occupancy detail for selected position — shown in ¿Correcto? avisos modal. */
  position_occupancy_hint?: string | null;
  position_occupant?: PositionOccupant | null;
  /** Claim pre-reserved LTA capacity for this shipping line (port + date). */
  claim_lta_space?: boolean;
  lta_space_candidate?: BulkImportLtaCandidate | null;
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
  batch_id: number;
  created_count: number;
  failed_count: number;
  retry_count?: number;
  created: { id: string; booking_id: number; booking_code: string }[];
  failures: { id?: string; row_id?: string | number; detail: string }[];
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

export async function revalidateBulkImportRow(
  row: BulkImportPreviewRow,
): Promise<BulkImportPreviewRow> {
  return apiFetch<BulkImportPreviewRow>(`${BASE}bulk-import/revalidate/`, {
    method: "POST",
    body: JSON.stringify(row),
  });
}

export async function createBulkBookingImport(
  rows: BulkImportPreviewRow[],
  options?: {
    source?: "file" | "paste";
    label?: string;
    deferredRows?: BulkImportPreviewRow[];
  },
): Promise<BulkImportCreateResponse> {
  return apiFetch<BulkImportCreateResponse>(`${BASE}bulk-import/create/`, {
    method: "POST",
    body: JSON.stringify({
      rows,
      deferred_rows: options?.deferredRows ?? [],
      source: options?.source ?? "file",
      label: options?.label ?? "",
    }),
  });
}

export async function exportBulkImportRowsXlsx(
  rows: BulkImportPreviewRow[] | Record<string, unknown>[],
  filename = "import-pendientes.xlsx",
): Promise<void> {
  const { blob, filename: serverName } = await apiDownload(
    `${BASE}bulk-import/export-rows/`,
    {
      method: "POST",
      body: JSON.stringify({ rows }),
    },
  );
  triggerBrowserDownload(blob, serverName || filename);
}

export async function exportImportBatchPendingXlsx(
  batchId: number,
): Promise<void> {
  const { blob, filename } = await apiDownload(
    `${BASE}import-batches/${batchId}/export/`,
  );
  triggerBrowserDownload(blob, filename || `import-pendientes-${batchId}.xlsx`);
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
