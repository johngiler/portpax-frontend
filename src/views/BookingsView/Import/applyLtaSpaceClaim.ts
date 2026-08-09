import type { BulkImportPreviewRow } from "@/services/bookings/bulkImportService";

/** Apply or clear LTA space claim on a preview row (CL + pier from candidate). */
export function applyLtaSpaceClaim(
  row: BulkImportPreviewRow,
  claim: boolean,
): BulkImportPreviewRow {
  if (!row.lta_space_candidate) {
    return row.claim_lta_space ? { ...row, claim_lta_space: false } : row;
  }
  if (!claim) {
    return { ...row, claim_lta_space: false };
  }
  return {
    ...row,
    claim_lta_space: true,
    suggested_status: "cl",
    position_id: row.lta_space_candidate.position_id ?? row.position_id,
    position_code: row.lta_space_candidate.position_code ?? row.position_code,
  };
}
