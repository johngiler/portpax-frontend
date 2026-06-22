import type { BookingStatus } from "@/types/booking";
import { bookingStatusLabel } from "@/types/booking";

type BookingStatusBadgeProps = {
  status: BookingStatus;
  className?: string;
};

const STATUS_STYLES: Record<BookingStatus, string> = {
  confirmed:
    "bg-emerald-100 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-500/20",
  cancelled:
    "bg-red-100 text-red-700 ring-red-600/15 dark:bg-red-950/50 dark:text-red-400 dark:ring-red-500/20",
  requested:
    "bg-[var(--admin-accent)]/10 text-[var(--admin-accent)] ring-[var(--admin-accent)]/20",
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
      {bookingStatusLabel(status)}
    </span>
  );
}
