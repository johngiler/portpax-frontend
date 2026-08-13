import type {
  BookingConflictItem,
  BookingConflictSeverity,
} from "@/types/booking";
import { issueSeverity } from "@/lib/bookingConflictSeverity";

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

/** Resolve paint severity for list/calendar/detail frames (matches aviso color). */
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

export function conflictCardClassName(
  severity: BookingConflictSeverity | null | undefined | boolean,
  extra = "",
): string {
  // Legacy callers may pass has_conflict boolean.
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
