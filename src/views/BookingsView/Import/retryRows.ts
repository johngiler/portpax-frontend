import type { BulkImportPreviewRow } from "@/services/bookings/bulkImportService";
import type { ImportBatchRetryRow } from "@/services/bookings/bookingActivityService";
import { BULK_BOOKING_PASTE_COLUMNS } from "@/lib/importFormatGuides";

function formatPasteDate(callDate: string | null): string {
  if (!callDate) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(callDate);
  if (!match) return callDate;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function formatPasteTime(time: string | null): string {
  if (!time) return "";
  return time.slice(0, 5);
}

/** Rebuild paste TSV so preview can re-resolve catalog/LTA for pending rows. */
export function buildItmTsvFromRetryRows(
  rows: Array<ImportBatchRetryRow | BulkImportPreviewRow>,
): string {
  const header = [...BULK_BOOKING_PASTE_COLUMNS].join("\t");
  const lines = rows.map((row) =>
    [
      ("shipping_line_name" in row && row.shipping_line_name) ||
        row.vendor_name ||
        "",
      row.ship || row.vessel_name || "",
      row.port_raw || row.port_name || "",
      formatPasteDate(row.call_date),
      formatPasteTime(row.eta),
      formatPasteTime(row.etd),
      row.position_code || "",
    ].join("\t"),
  );
  return [header, ...lines].join("\n");
}

export function retryRowsToPreviewRows(
  rows: ImportBatchRetryRow[],
): BulkImportPreviewRow[] {
  return rows.map((row, index) => ({
    id: row.id || `retry-${index}`,
    row_number: row.row_number || index + 1,
    ship: row.ship || "",
    port_raw: row.port_raw || "",
    vendor_name: row.vendor_name || "",
    call_type: row.call_type || "",
    call_date: row.call_date,
    eta: row.eta,
    etd: row.etd,
    port_id: row.port_id,
    port_name: row.port_name,
    port_code: row.port_code,
    vessel_id: row.vessel_id,
    vessel_name: row.vessel_name,
    shipping_line_id: row.shipping_line_id,
    shipping_line_name: row.shipping_line_name,
    suggested_status: row.suggested_status,
    position_id: row.position_id ?? null,
    position_code: row.position_code ?? null,
    claim_lta_space: Boolean(row.claim_lta_space),
    lta_space_candidate: row.lta_space_candidate ?? null,
    issues: row.issues ?? [],
    warnings: row.warnings ?? [],
    selectable: Boolean(row.selectable),
    selected_default: Boolean(row.selectable),
  }));
}

export async function copyImportRowsTsv(
  rows: Array<ImportBatchRetryRow | BulkImportPreviewRow>,
): Promise<void> {
  const text = buildItmTsvFromRetryRows(rows);
  await navigator.clipboard.writeText(text);
}

const ITM_PASTE_HEADERS = [...BULK_BOOKING_PASTE_COLUMNS];

/** Matrix for ImportPasteModal prefill from pending batch rows. */
export function retryRowsToPasteMatrix(
  rows: Array<ImportBatchRetryRow | BulkImportPreviewRow>,
): { headers: string[]; rows: string[][] } {
  return {
    headers: [...ITM_PASTE_HEADERS],
    rows: rows.map((row) => [
      ("shipping_line_name" in row && row.shipping_line_name) ||
        row.vendor_name ||
        "",
      row.ship || row.vessel_name || "",
      row.port_raw || row.port_name || "",
      formatPasteDate(row.call_date),
      formatPasteTime(row.eta),
      formatPasteTime(row.etd),
      row.position_code || "",
    ]),
  };
}
