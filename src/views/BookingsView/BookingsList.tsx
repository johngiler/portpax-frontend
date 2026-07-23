"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronRight, MapPin } from "lucide-react";
import BookingMetaRow from "@/components/booking/BookingMetaRow";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import CatalogLogoThumb from "@/components/ui/CatalogLogoThumb";
import { currentReturnTo } from "@/lib/safeReturnTo";
import { formatIsoDateLabel, parseIsoDate } from "@/lib/bookingDates";
import {
  bookingDetailHref,
  getBookingBadgeStatus,
  type Booking,
} from "@/types/booking";
import BookingsEmptyState from "./BookingsEmptyState";

type BookingsListProps = {
  bookings: Booking[];
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
};

function DateBadge({ callDate }: { callDate: string }) {
  const { day, monthIndex } = parseIsoDate(callDate);
  const month = new Date(2000, monthIndex, 1).toLocaleDateString("es-MX", {
    month: "short",
  });

  return (
    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
      <span className="text-xl font-bold leading-none">{day}</span>
      <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide">
        {month}
      </span>
    </div>
  );
}

export default function BookingsList({
  bookings,
  hasActiveFilters = false,
  onClearFilters,
}: BookingsListProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = currentReturnTo(pathname, searchParams);

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
      {bookings.map((booking) => {
        const positionLabel = booking.position_code || "Sin asignar";
        return (
          <li key={booking.id}>
            <Link
              href={bookingDetailHref(booking, { returnTo })}
              className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-[var(--admin-card-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--admin-accent)]/30 hover:shadow-lg sm:items-center sm:gap-4 dark:border-zinc-800 dark:bg-zinc-900/80"
            >
              <DateBadge callDate={booking.call_date} />

              <CatalogLogoThumb
                src={booking.port_logo}
                alt=""
                size="md"
                kind="port"
                className="mt-0.5 shrink-0 sm:mt-0"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {booking.vessel_name}
                  </p>
                  <BookingStatusBadge status={getBookingBadgeStatus(booking)} />
                </div>

                <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-300">
                  <MapPin
                    className="h-3.5 w-3.5 shrink-0 text-zinc-400"
                    aria-hidden
                  />
                  <span className="truncate">
                    {booking.port_name}
                    <span className="text-zinc-400"> · </span>
                    {booking.shipping_line_name}
                  </span>
                </p>

                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {formatIsoDateLabel(booking.call_date, "long")}
                </p>

                <BookingMetaRow
                  className="mt-2"
                  loaM={booking.vessel_loa_m}
                  eta={booking.eta}
                  etd={booking.etd}
                  positionLabel={positionLabel}
                />

                <code className="mt-2 block truncate text-[10px] font-medium tracking-wide text-zinc-400 sm:hidden">
                  {booking.booking_code}
                </code>
              </div>

              <div className="hidden shrink-0 flex-col items-end gap-2 self-center sm:flex">
                <code className="max-w-[11rem] truncate rounded-md bg-zinc-50 px-2 py-1 text-[10px] font-semibold tracking-wide text-zinc-500 dark:bg-zinc-950/60 dark:text-zinc-400">
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
        );
      })}
    </ul>
  );
}
