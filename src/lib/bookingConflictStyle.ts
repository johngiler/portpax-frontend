import type {
  BookingConflictItem,
  BookingConflictSeverity,
} from "@/types/booking";
import {
  CONFLICT_SEVERITY_BY_CODE,
  issueSeverity,
} from "@/lib/bookingConflictSeverity";

/** Shared visual treatment for bookings with operational conflicts. */

const CARD_BY_SEVERITY: Record<BookingConflictSeverity, string[]> = {
  red: [
    "ring-2 ring-red-500/90 ring-offset-2 dark:ring-red-400/80",
    "border-red-400 dark:border-red-600",
    "bg-red-50/40 dark:bg-red-950/20",
  ],
  yellow: [
    "ring-2 ring-amber-400/90 ring-offset-2 dark:ring-amber-500/70",
    "border-amber-300 dark:border-amber-700",
    "bg-amber-50/50 dark:bg-amber-950/20",
  ],
  green: [
    "ring-2 ring-emerald-400/90 ring-offset-2 dark:ring-emerald-500/70",
    "border-emerald-300 dark:border-emerald-700",
    "bg-emerald-50/40 dark:bg-emerald-950/20",
  ],
};

const CHIP_BY_SEVERITY: Record<BookingConflictSeverity, string> = {
  red: "ring-2 ring-red-500 ring-offset-1 dark:ring-red-400",
  yellow: "ring-2 ring-amber-400 ring-offset-1 dark:ring-amber-500",
  green: "ring-2 ring-emerald-400 ring-offset-1 dark:ring-emerald-500",
};

const BADGE_BY_SEVERITY: Record<BookingConflictSeverity, string> = {
  red: "bg-red-500/10 text-red-700 dark:text-red-300",
  yellow: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
  green: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
};

const FIELD_HIGHLIGHT_BY_SEVERITY: Record<BookingConflictSeverity, string> = {
  red: "rounded-md bg-red-500/15 px-1 py-0.5 ring-1 ring-red-500/80 dark:bg-red-500/20 dark:ring-red-400",
  yellow:
    "rounded-md bg-amber-500/20 px-1 py-0.5 ring-1 ring-amber-500/80 dark:bg-amber-500/25 dark:ring-amber-400",
  green:
    "rounded-md bg-emerald-500/15 px-1 py-0.5 ring-1 ring-emerald-500/80 dark:bg-emerald-500/20 dark:ring-emerald-400",
};

/**
 * Where to paint a conflict on list/calendar/availability cards.
 * `card` = full frame (code has no matching meta field on the chip).
 */
export type ConflictHighlightTarget = "loa" | "schedule" | "position" | "card";

const CONFLICT_HIGHLIGHT_BY_CODE: Record<string, ConflictHighlightTarget> = {
  // LOA / metraje on card
  loa_exceeds_position: "loa",
  loa_overhang: "loa",
  loa_shared_pier: "loa",
  loa_recalc_exceeds: "loa",
  loa_recalc_sum_red: "loa",
  loa_recalc_sum_yellow: "loa",
  loa_recalc_sum_green: "loa",
  combined_loa_red: "loa",
  combined_loa_orange: "loa",
  // Horario on card
  eta_close: "schedule",
  eta_before_min: "schedule",
  filo_eta_violation: "schedule",
  filo_etd_violation: "schedule",
  // Posición on card
  position_occupied: "position",
  lta_slot_reserved: "position",
  lta_priority_conflict: "position",
  no_position_available: "position",
  combined_position_retired: "position",
  // Not shown as a specific meta field → full card
  beam_exceeds_position: "card",
  draft_too_deep: "card",
  multi_port_conflict: "card",
  multi_port_proximity: "card",
  lta_beyond_horizon: "card",
  lta_horizon_denied: "card",
};

export type BookingConflictHighlights = {
  severity: BookingConflictSeverity | null;
  /** Full card/chip ring — only when a non-field conflict exists. */
  frameCard: boolean;
  highlightLoa: boolean;
  highlightSchedule: boolean;
  highlightPosition: boolean;
  loaSeverity: BookingConflictSeverity | null;
  scheduleSeverity: BookingConflictSeverity | null;
  positionSeverity: BookingConflictSeverity | null;
};

export function maxConflictSeverity(
  snapshot: BookingConflictItem[] | null | undefined,
): BookingConflictSeverity | null {
  const rank: Record<BookingConflictSeverity, number> = {
    red: 3,
    yellow: 2,
    green: 1,
  };
  let best: BookingConflictSeverity | null = null;
  let bestN = 0;
  for (const item of snapshot ?? []) {
    const sev = issueSeverity(item);
    const n = rank[sev];
    if (n > bestN) {
      bestN = n;
      best = sev;
    }
  }
  return best;
}

/** Resolve paint severity for badges (matches aviso color). */
export function bookingFrameSeverity(booking: {
  has_conflict?: boolean | null;
  conflict_severity?: BookingConflictSeverity | string | null;
  conflict_snapshot?: BookingConflictItem[] | null;
}): BookingConflictSeverity | null {
  if (!booking.has_conflict) return null;
  const direct = booking.conflict_severity;
  if (direct === "red" || direct === "yellow" || direct === "green") {
    return direct;
  }
  return maxConflictSeverity(booking.conflict_snapshot) ?? "yellow";
}

function highlightTargetForCode(code: string): ConflictHighlightTarget {
  return CONFLICT_HIGHLIGHT_BY_CODE[code] ?? "card";
}

function maxSeverity(
  a: BookingConflictSeverity | null,
  b: BookingConflictSeverity,
): BookingConflictSeverity {
  const rank: Record<BookingConflictSeverity, number> = {
    red: 3,
    yellow: 2,
    green: 1,
  };
  if (!a) return b;
  return rank[b] > rank[a] ? b : a;
}

/**
 * Field-level vs full-card conflict paint from snapshot codes.
 * LOA → metraje; schedule → hora; position → posición; else → marco del card.
 */
export function bookingConflictHighlights(booking: {
  has_conflict?: boolean | null;
  conflict_severity?: BookingConflictSeverity | string | null;
  conflict_snapshot?: BookingConflictItem[] | null;
}): BookingConflictHighlights {
  const severity = bookingFrameSeverity(booking);
  if (!severity) {
    return {
      severity: null,
      frameCard: false,
      highlightLoa: false,
      highlightSchedule: false,
      highlightPosition: false,
      loaSeverity: null,
      scheduleSeverity: null,
      positionSeverity: null,
    };
  }

  const snapshot = booking.conflict_snapshot ?? [];
  let frameCard = false;
  let loaSeverity: BookingConflictSeverity | null = null;
  let scheduleSeverity: BookingConflictSeverity | null = null;
  let positionSeverity: BookingConflictSeverity | null = null;

  if (snapshot.length === 0) {
    frameCard = true;
  } else {
    for (const item of snapshot) {
      const code = item.code || "";
      const sev =
        CONFLICT_SEVERITY_BY_CODE[code] ??
        issueSeverity(item);
      const target = highlightTargetForCode(code);
      if (target === "loa") loaSeverity = maxSeverity(loaSeverity, sev);
      else if (target === "schedule") {
        scheduleSeverity = maxSeverity(scheduleSeverity, sev);
      } else if (target === "position") {
        positionSeverity = maxSeverity(positionSeverity, sev);
      } else frameCard = true;
    }
  }

  return {
    severity,
    frameCard,
    highlightLoa: loaSeverity != null,
    highlightSchedule: scheduleSeverity != null,
    highlightPosition: positionSeverity != null,
    loaSeverity,
    scheduleSeverity,
    positionSeverity,
  };
}

export function conflictCardClassName(
  severity: BookingConflictSeverity | null | undefined | boolean,
  extra = "",
): string {
  const sev: BookingConflictSeverity | null =
    severity === true
      ? "red"
      : severity === false || severity == null
        ? null
        : severity;
  if (!sev) return extra;
  return [...CARD_BY_SEVERITY[sev], extra].filter(Boolean).join(" ");
}

export function conflictChipClassName(
  severity: BookingConflictSeverity | null | undefined | boolean,
): string {
  const sev: BookingConflictSeverity | null =
    severity === true
      ? "red"
      : severity === false || severity == null
        ? null
        : severity;
  if (!sev) return "";
  return CHIP_BY_SEVERITY[sev];
}

export function conflictBadgeClassName(
  severity: BookingConflictSeverity | null | undefined,
): string {
  const sev = severity ?? "yellow";
  return `inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${BADGE_BY_SEVERITY[sev]}`;
}

export function conflictFieldHighlightClassName(
  severity: BookingConflictSeverity | null | undefined,
): string {
  if (!severity) return "";
  return FIELD_HIGHLIGHT_BY_SEVERITY[severity];
}
