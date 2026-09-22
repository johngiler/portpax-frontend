"use client";

import { Medal } from "lucide-react";

type FirstArrivalBadgeProps = {
  className?: string;
  /** Compact icon-only for dense cards. */
  compact?: boolean;
};

/** Yellow medal for bookings with first_arrival=True. */
export default function FirstArrivalBadge({
  className = "",
  compact = false,
}: FirstArrivalBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full bg-amber-100 font-medium text-amber-900 dark:bg-amber-950/60 dark:text-amber-100",
        compact ? "px-1.5 py-0.5" : "px-2 py-0.5 text-[11px]",
        className,
      ].join(" ")}
      title="Primer arribo"
      aria-label="Primer arribo"
    >
      <Medal
        className={compact ? "h-3 w-3" : "h-3.5 w-3.5"}
        strokeWidth={2.25}
        aria-hidden
      />
      {compact ? null : <span>Primer arribo</span>}
    </span>
  );
}
