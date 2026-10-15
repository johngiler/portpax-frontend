import { apiDownload, apiFetch, triggerBrowserDownload } from "@/services/apiClient";
import type { PositionOccupant } from "@/types/booking";

export type BulkImportLtaCandidate = {
  id: number;
  booking_code: string;
  status?: string;
  vessel_name: string;
  /** True when catalog vessel looks like an LTA class/ghost placeholder. */
  vessel_is_provisional?: boolean;
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
  shipping_line_group_id?: number | null;
  shipping_line_group_name?: string | null;
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
    tagName?: string;
  },
): Promise<BulkImportCreateResponse> {
  return apiFetch<BulkImportCreateResponse>(`${BASE}bulk-import/create/`, {
    method: "POST",
    body: JSON.stringify({
      rows,
      deferred_rows: options?.deferredRows ?? [],
      source: options?.source ?? "file",
      label: options?.label ?? "",
      tag_name: options?.tagName?.trim() || undefined,
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

export type BookingRecapMatch = {
  booking_id: number;
  booking_code: string;
  match: "exact" | "approx";
  match_percent?: number;
  match_reason?: string;
  avisos: string[];
  /** Recap schedule — FE re-scores draft ETA/ETD/date against these. */
  recap_call_date?: string | null;
  recap_eta?: string | null;
  recap_etd?: string | null;
};

export type BookingRecapUnmatched = {
  row_number: number | null;
  ship: string;
  port: string;
  /** Shipping line name from the Naviera paste column. */
  line?: string | null;
  /** @deprecated Prefer `line`. Kept for older API payloads. */
  group?: string | null;
  call_date: string | null;
  eta?: string | null;
  etd?: string | null;
  reason: string;
};

/** In PortPax (port + date range) but not paired to any recap row. */
export type BookingRecapPortPaxOnly = {
  booking_id: number;
  booking_code: string;
  vessel_name: string;
  port_id?: number | null;
  port_name: string;
  shipping_line_name: string;
  call_date: string | null;
  eta?: string | null;
  etd?: string | null;
  status: string;
  status_display: string;
};

export type BookingRecapResponse = {
  imported_count: number;
  matched_count: number;
  matches: BookingRecapMatch[];
  unmatched: BookingRecapUnmatched[];
  portpax_only_count?: number;
  portpax_only?: BookingRecapPortPaxOnly[];
  portpax_only_page?: number;
  portpax_only_page_size?: number;
  portpax_only_has_more?: boolean;
  portpax_only_ports?: number[];
};

export type BookingRecapPortPaxOnlyPage = {
  portpax_only: BookingRecapPortPaxOnly[];
  portpax_only_count: number;
  portpax_only_page: number;
  portpax_only_page_size: number;
  portpax_only_has_more: boolean;
  portpax_only_ports?: number[];
};

/** Search delimiters for recap match (group / lines / date range). */
export type BookingRecapScope = {
  shipping_line_group_ids?: number[];
  shipping_line_ids?: number[];
  date_from?: string;
  date_to?: string;
};

function appendRecapScope(form: FormData, scope?: BookingRecapScope) {
  if (!scope) return;
  const groups = scope.shipping_line_group_ids ?? [];
  const lines = scope.shipping_line_ids ?? [];
  if (groups.length > 0) {
    form.append("shipping_line_group", groups.join(","));
  }
  if (lines.length > 0) {
    form.append("shipping_line", lines.join(","));
  }
  if (scope.date_from) form.append("date_from", scope.date_from);
  if (scope.date_to) form.append("date_to", scope.date_to);
}

export async function matchBookingRecap(
  file: File,
  scope?: BookingRecapScope,
): Promise<BookingRecapResponse> {
  const form = new FormData();
  form.append("file", file);
  appendRecapScope(form, scope);
  return apiFetch<BookingRecapResponse>(`${BASE}bulk-import/booking-recap/`, {
    method: "POST",
    body: form,
  });
}

export async function matchBookingRecapFromPaste(
  text: string,
  scope?: BookingRecapScope,
): Promise<BookingRecapResponse> {
  return apiFetch<BookingRecapResponse>(`${BASE}bulk-import/booking-recap/`, {
    method: "POST",
    body: JSON.stringify({
      text,
      shipping_line_group: scope?.shipping_line_group_ids?.length
        ? scope.shipping_line_group_ids.join(",")
        : undefined,
      shipping_line: scope?.shipping_line_ids?.length
        ? scope.shipping_line_ids.join(",")
        : undefined,
      date_from: scope?.date_from || undefined,
      date_to: scope?.date_to || undefined,
    }),
  });
}

/** Next page of PortPax-only rows (recap 「Cargar más」). */
export async function fetchBookingRecapPortPaxOnlyPage(params: {
  date_from: string;
  date_to: string;
  ports: number[];
  exclude_ids?: number[];
  shipping_line_ids?: number[];
  shipping_line_group_ids?: number[];
  page: number;
  page_size?: number;
}): Promise<BookingRecapPortPaxOnlyPage> {
  const query = new URLSearchParams();
  query.set("date_from", params.date_from);
  query.set("date_to", params.date_to);
  query.set("port", params.ports.join(","));
  query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));
  if (params.exclude_ids?.length) {
    query.set("exclude", params.exclude_ids.join(","));
  }
  if (params.shipping_line_ids?.length) {
    query.set("shipping_line", params.shipping_line_ids.join(","));
  }
  if (params.shipping_line_group_ids?.length) {
    query.set("shipping_line_group", params.shipping_line_group_ids.join(","));
  }
  return apiFetch<BookingRecapPortPaxOnlyPage>(
    `${BASE}bulk-import/booking-recap/portpax-only/?${query.toString()}`,
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
