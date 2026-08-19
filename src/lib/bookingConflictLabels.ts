/** Sidebar / API conflict type filter ids. */
export type ConflictTypeFilterValue =
  | "proximity"
  | "loa"
  | "schedule"
  | "position"
  | "lta"
  | "physical";

export const CONFLICT_TYPE_FILTER_CODES: Record<
  ConflictTypeFilterValue,
  readonly string[]
> = {
  proximity: ["multi_port_proximity", "multi_port_conflict"],
  loa: [
    "loa_exceeds_position",
    "loa_overhang",
    "loa_shared_pier",
    "loa_recalc_exceeds",
    "loa_recalc_sum_red",
    "loa_recalc_sum_yellow",
    "loa_recalc_sum_green",
    "combined_loa_red",
    "combined_loa_orange",
  ],
  schedule: [
    "eta_close",
    "eta_before_min",
    "filo_eta_violation",
    "filo_etd_violation",
  ],
  position: [
    "position_occupied",
    "no_position_available",
    "combined_position_retired",
    "lta_slot_reserved",
  ],
  lta: [
    "lta_priority_conflict",
    "lta_beyond_horizon",
    "lta_horizon_denied",
  ],
  physical: ["beam_exceeds_position", "draft_too_deep"],
};
