/** Shared visual treatment for bookings with operational conflicts. */

export function conflictCardClassName(
  hasConflict: boolean | undefined | null,
  extra = "",
): string {
  if (!hasConflict) return extra;
  return [
    "ring-2 ring-red-400/80 ring-offset-1 dark:ring-red-500/70",
    "border-red-300/80 dark:border-red-800/60",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function conflictChipClassName(
  hasConflict: boolean | undefined | null,
): string {
  if (!hasConflict) return "";
  return "ring-2 ring-red-400 ring-offset-1 dark:ring-red-500";
}
