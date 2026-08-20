import type {
  BookingConflictSeverity,
  BookingValidationIssue,
} from "@/types/booking";

/**
 * Mirror of backend `CONFLICT_SEVERITY_BY_CODE`.
 * Code map wins over stale snapshot severity for consistent paint.
 *
 * yellow — non-blocking aviso (default)
 * red — very heavy berthing / physical / FILO / semaphore red
 * green — LOA recalc traffic-light OK
 */
export const CONFLICT_SEVERITY_BY_CODE: Record<string, BookingConflictSeverity> =
  {
    position_occupied: "red",
    lta_priority_conflict: "red",
    loa_exceeds_position: "red",
    beam_exceeds_position: "red",
    draft_too_deep: "red",
    combined_position_retired: "red",
    /** Legacy overhang-only; paint yellow — red only for loa_recalc_sum_red. */
    loa_recalc_exceeds: "yellow",
    loa_recalc_sum_red: "red",
    combined_loa_red: "red",
    filo_eta_violation: "red",
    filo_etd_violation: "red",
    eta_close: "yellow",
    eta_before_min: "yellow",
    loa_overhang: "yellow",
    loa_shared_pier: "yellow",
    loa_recalc_sum_yellow: "yellow",
    combined_loa_orange: "yellow",
    lta_slot_reserved: "yellow",
    lta_beyond_horizon: "yellow",
    lta_horizon_denied: "yellow",
    multi_port_conflict: "yellow",
    multi_port_proximity: "yellow",
    no_position_available: "yellow",
    loa_recalc_sum_green: "green",
  };

/** Resolve paint color for an operational issue (semaforo or default amber). */
export function issueSeverity(
  issue: Pick<BookingValidationIssue, "code" | "severity" | "level"> | {
    code: string;
    severity?: BookingConflictSeverity | string | null;
    level?: BookingValidationIssue["level"] | null;
  },
): BookingConflictSeverity {
  const mapped = CONFLICT_SEVERITY_BY_CODE[issue.code];
  if (mapped) return mapped;
  if (
    issue.severity === "red" ||
    issue.severity === "yellow" ||
    issue.severity === "green"
  ) {
    return issue.severity;
  }
  if (issue.level === "info") return "green";
  // Non-blocking defaults → amber (never assume red).
  return "yellow";
}
