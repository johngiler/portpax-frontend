import type {
  BookingConflictChip,
  BookingConflictHighlights,
  BookingConflictSeverity,
} from "@/types/booking";

export const EMPTY_CONFLICT_HIGHLIGHTS: BookingConflictHighlights = {
  severity: null,
  frame_card: false,
  highlight_loa: false,
  highlight_schedule: false,
  highlight_position: false,
  loa_severity: null,
  schedule_severity: null,
  position_severity: null,
};

export type ConflictDisplaySource = {
  conflict_chips?: BookingConflictChip[];
  conflict_highlights?: BookingConflictHighlights | null;
};

export function conflictChipsFromApi(
  source: ConflictDisplaySource,
): BookingConflictChip[] {
  return source.conflict_chips ?? [];
}

export function conflictHighlightsFromApi(
  source: ConflictDisplaySource,
): BookingConflictHighlights {
  return source.conflict_highlights ?? EMPTY_CONFLICT_HIGHLIGHTS;
}

/** Card/list outer frame severity (API-driven). */
export function conflictListFrameSeverity(
  highlights: BookingConflictHighlights,
): BookingConflictSeverity | null {
  return highlights.frame_card ? highlights.severity : null;
}

/** Matrix/calendar call card frame severity (API-driven). */
export function conflictCallCardFrameSeverity(
  highlights: BookingConflictHighlights,
): BookingConflictSeverity | null {
  return highlights.frame_card || highlights.highlight_position
    ? highlights.severity
    : null;
}

export function conflictChipTitle(
  chips: BookingConflictChip[] | undefined,
): string {
  return (chips ?? []).map((chip) => chip.label).join(", ");
}
