"use client";

import Link from "next/link";
import { ChevronRight, Ship } from "lucide-react";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import { formatIsoDateLabel, parseIsoDate } from "@/lib/bookingDates";
import { bookingDetailHref, getBookingBadgeStatus, type Booking } from "@/types/booking";
import BookingsEmptyState from "./BookingsEmptyState";

type BookingsListProps = {
  bookings: Booking[];
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
};

function DateBadge({ callDate }: { callDate: string }) {
  const { day, monthIndex } = parseIsoDate(callDate);
  const month = new Date(2000, monthIndex, 1).toLocaleDateString("es-MX", { month: "short" });

  return (
    <div
      className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]"
    >
      <span className="text-xl font-bold leading-none">{day}</span>
      <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide">{month}</span>
    </div>
  );
}

export default function BookingsList({
  bookings,
  hasActiveFilters = false,
  onClearFilters,
}: BookingsListProps) {
  if (bookings.length === 0) {
    return (
      <BookingsEmptyState
        variant={hasActiveFilters ? "filtered" : "empty"}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <ul className="space-y-3">
      {bookings.map((booking) => (
        <li key={booking.id}>
          <Link
            href={bookingDetailHref(booking)}
            className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-[var(--admin-card-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--admin-accent)]/30 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/80"
          >
            <DateBadge callDate={booking.call_date} />

            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/50"
              >
                {booking.port_logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={booking.port_logo}
                    alt=""
                    className="max-h-8 max-w-8 object-contain"
                  />
                ) : (
                  <Ship className="h-5 w-5 text-[var(--admin-accent)]/50" strokeWidth={2} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {booking.vessel_name}
                  </p>
                  <BookingStatusBadge status={getBookingBadgeStatus(booking)} />
                </div>
                <p className="mt-0.5 truncate text-sm text-zinc-600 dark:text-zinc-300">
                  {booking.port_name} · {booking.shipping_line_name}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {formatIsoDateLabel(booking.call_date, "long")}
                </p>
              </div>
            </div>

            <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
              <code className="max-w-[14rem] truncate text-[11px] font-semibold text-[var(--admin-accent)]">
                {booking.booking_code}
              </code>
              <ChevronRight
                className="h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--admin-accent)]"
                strokeWidth={2}
                aria-hidden
              />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
