import type { BookingConflictSeverity } from "@/types/booking";

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
