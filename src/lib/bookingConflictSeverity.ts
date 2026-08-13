import type {
  BookingConflictSeverity,
  BookingValidationIssue,
} from "@/types/booking";

/**
 * Mirror of backend `CONFLICT_SEVERITY_BY_CODE`.
 * Used when the API omits `severity` so UI still paints correctly.
 */
export const CONFLICT_SEVERITY_BY_CODE: Record<string, BookingConflictSeverity> =
  {
    position_occupied: "red",
    lta_priority_conflict: "red",
    eta_close: "yellow",
    eta_before_min: "yellow",
    loa_exceeds_position: "red",
    loa_overhang: "yellow",
    loa_shared_pier: "yellow",
    beam_exceeds_position: "red",
    draft_too_deep: "red",
    mooring_capacity: "yellow",
    combined_position_retired: "red",
    loa_recalc_exceeds: "red",
    loa_recalc_sum_red: "red",
    loa_recalc_sum_yellow: "yellow",
    loa_recalc_sum_green: "green",
    combined_loa_red: "red",
    combined_loa_orange: "yellow",
    filo_eta_violation: "red",
    filo_etd_violation: "red",
    lta_slot_reserved: "red",
    lta_beyond_horizon: "yellow",
    lta_horizon_denied: "yellow",
    multi_port_conflict: "yellow",
    multi_port_proximity: "yellow",
    no_position_available: "yellow",
  };

/** Resolve paint color for an operational issue (semaforo or default amber). */
export function issueSeverity(
  issue: Pick<BookingValidationIssue, "code" | "severity" | "level"> | {
    code: string;
    severity?: BookingConflictSeverity | string | null;
    level?: BookingValidationIssue["level"] | null;
  },
): BookingConflictSeverity {
  if (
    issue.severity === "red" ||
    issue.severity === "yellow" ||
    issue.severity === "green"
  ) {
    return issue.severity;
  }
  const mapped = CONFLICT_SEVERITY_BY_CODE[issue.code];
  if (mapped) return mapped;
  if (issue.level === "error") return "red";
  if (issue.level === "info") return "green";
  // Non-blocking defaults without traffic-light → amber/orange.
  return "yellow";
}
