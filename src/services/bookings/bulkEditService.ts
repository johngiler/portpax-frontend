import { apiFetch } from "@/services/apiClient";
import type { BookingValidationIssue } from "@/types/booking";

const BASE = "api/bookings/";

export type BulkEditRow = {
  booking_id: number;
  booking_code: string;
  port_id: number;
  port_name?: string | null;
  port_code?: string | null;
  shipping_line_id: number;
  shipping_line_name?: string | null;
  shipping_line_group?: number | null;
  vessel_id: number;
  vessel_name?: string | null;
  call_date: string;
  eta: string | null;
  etd: string | null;
  position_id: number | null;
  position_code?: string | null;
  status: string;
  notes: string;
  blocking_issues: BookingValidationIssue[];
  warnings: BookingValidationIssue[];
  selectable: boolean;
};

export type BulkEditApplyResponse = {
  updated_count: number;
  failed_count: number;
  updated: { booking_id: number; booking_code: string }[];
  failed: { booking_id: number; detail: string }[];
};

export async function previewBulkEdit(
  bookingIds: number[],
): Promise<{ rows: BulkEditRow[]; total: number }> {
  return apiFetch(`${BASE}bulk-edit/preview/`, {
    method: "POST",
    body: JSON.stringify({ booking_ids: bookingIds }),
  });
}

export async function revalidateBulkEditRow(
  row: Partial<BulkEditRow> & { booking_id: number },
): Promise<BulkEditRow> {
  return apiFetch(`${BASE}bulk-edit/revalidate/`, {
    method: "POST",
    body: JSON.stringify(row),
  });
}

export async function applyBulkEdit(
  rows: BulkEditRow[],
  options?: {
    port_operator_override?: boolean;
    override_reason?: string;
  },
): Promise<BulkEditApplyResponse> {
  return apiFetch(`${BASE}bulk-edit/apply/`, {
    method: "POST",
    body: JSON.stringify({
      port_operator_override: options?.port_operator_override || undefined,
      override_reason: options?.override_reason?.trim() || undefined,
      rows: rows.map((r) => ({
        booking_id: r.booking_id,
        port_id: r.port_id,
        shipping_line_id: r.shipping_line_id,
        vessel_id: r.vessel_id,
        call_date: r.call_date,
        eta: r.eta,
        etd: r.etd,
        position_id: r.position_id,
        status: r.status,
        notes: r.notes,
      })),
    }),
  });
}
