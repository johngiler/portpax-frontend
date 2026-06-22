"use client";

import Link from "next/link";
import DefaultButton from "@/components/buttons/DefaultButton";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import { bookingDetailHref, type Booking } from "@/types/booking";

type BookingWizardSuccessProps = {
  bookings: Booking[];
  onNewBooking: () => void;
  onViewAll: () => void;
};

export default function BookingWizardSuccess({
  bookings,
  onNewBooking,
  onViewAll,
}: BookingWizardSuccessProps) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
        <span className="text-2xl font-bold">{bookings.length}</span>
      </div>
      <h2 className="mt-4 text-center text-xl font-bold text-zinc-900 dark:text-zinc-50">
        Reservas creadas
      </h2>
      <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Se generaron {bookings.length} código{bookings.length === 1 ? "" : "s"} de reserva en un
        solo paquete.
      </p>

      <ul className="mt-6 space-y-2">
        {bookings.map((booking) => (
          <li key={booking.id}>
            <Link
              href={bookingDetailHref(booking)}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-zinc-200/80 px-4 py-3 text-sm transition-colors hover:border-[var(--admin-accent)]/30 hover:bg-[var(--admin-accent)]/[0.04] dark:border-zinc-700 dark:hover:bg-[var(--admin-accent)]/10"
            >
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {formatIsoDateLabel(booking.call_date)}
              </span>
              <code className="text-xs font-semibold text-[var(--admin-accent)]">
                {booking.booking_code}
              </code>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <DefaultButton type="button" onClick={onViewAll}>
          Ver reservas
        </DefaultButton>
        <button
          type="button"
          onClick={onNewBooking}
          className="cursor-pointer rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Nueva reserva
        </button>
      </div>
    </div>
  );
}
