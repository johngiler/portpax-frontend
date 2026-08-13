/** Shared visual treatment for bookings with operational conflicts. */

export function conflictCardClassName(
  hasConflict: boolean | undefined | null,
  extra = "",
): string {
  if (!hasConflict) return extra;
  return [
    "ring-2 ring-red-500/90 ring-offset-2 dark:ring-red-400/80",
    "border-red-400 dark:border-red-600",
    "bg-red-50/40 dark:bg-red-950/20",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function conflictChipClassName(
  hasConflict: boolean | undefined | null,
): string {
  if (!hasConflict) return "";
  return "ring-2 ring-red-500 ring-offset-1 dark:ring-red-400";
}
