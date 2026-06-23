"use client";

import type { BookingBadgeStatus } from "@/types/booking";
import { bookingBadgeStatusLabel } from "@/types/booking";

type BookingStatusBadgeProps = {
  status: BookingBadgeStatus;
  className?: string;
};

const STATUS_STYLES: Record<BookingBadgeStatus, string> = {
  confirmed:
    "bg-emerald-100 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-500/20",
  cancelled:
    "bg-red-100 text-red-700 ring-red-600/15 dark:bg-red-950/50 dark:text-red-400 dark:ring-red-500/20",
  requested:
    "bg-[var(--admin-accent)]/10 text-[var(--admin-accent)] ring-[var(--admin-accent)]/20",
  completed:
    "bg-zinc-100 text-zinc-600 ring-zinc-500/15 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-600/20",
};

export default function BookingStatusBadge({ status, className = "" }: BookingStatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        STATUS_STYLES[status],
        className,
      ].join(" ")}
    >
      {bookingBadgeStatusLabel(status)}
    </span>
  );
}
