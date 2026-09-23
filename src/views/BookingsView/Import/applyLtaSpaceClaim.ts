import type { BulkEditRow } from "@/services/bookings/bulkEditService";
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

export function applyEditLtaSpaceClaim(
  row: BulkEditRow,
  claim: boolean,
): BulkEditRow {
  if (!row.lta_space_candidate) {
    return row.claim_lta_space ? { ...row, claim_lta_space: false } : row;
  }
  if (!claim) {
    return { ...row, claim_lta_space: false };
  }
  return {
    ...row,
    claim_lta_space: true,
    status: "cl",
    position_id: row.lta_space_candidate.position_id ?? row.position_id,
    position_code: row.lta_space_candidate.position_code ?? row.position_code,
  };
}

/** Keep an in-progress claim if revalidate still sees the LTA candidate. */
export function mergeEditRowAfterRevalidate(
  draft: BulkEditRow,
  next: BulkEditRow,
): BulkEditRow {
  const candidate = next.lta_space_candidate ?? draft.lta_space_candidate ?? null;
  const claimed = Boolean(
    next.claim_lta_space || (draft.claim_lta_space && candidate),
  );
  return {
    ...draft,
    ...next,
    port_name: next.port_name ?? draft.port_name,
    port_code: next.port_code ?? draft.port_code,
    vessel_name: next.vessel_name ?? draft.vessel_name,
    shipping_line_name: next.shipping_line_name ?? draft.shipping_line_name,
    shipping_line_group: next.shipping_line_group ?? draft.shipping_line_group,
    position_code: next.position_code ?? draft.position_code,
    lta_space_candidate: candidate,
    claim_lta_space: claimed,
  };
}
