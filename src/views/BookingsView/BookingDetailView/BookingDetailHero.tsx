"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, Hash } from "lucide-react";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import type { Booking } from "@/types/booking";

type BookingDetailHeroProps = {
  booking: Booking;
};

export default function BookingDetailHero({ booking }: BookingDetailHeroProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="border-b border-zinc-200/80 bg-gradient-to-r from-[var(--admin-accent)]/12 via-[var(--admin-accent)]/5 to-transparent px-5 py-4 dark:border-zinc-800">
        <Link
          href="/bookings"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-[var(--admin-accent)] dark:text-zinc-400"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          Volver a reservas
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <BookingStatusBadge status={booking.status} className="text-xs" />
              <span className="text-xs font-medium text-zinc-400">
                Actualizado {new Date(booking.updated_at).toLocaleDateString("es-MX")}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {booking.vessel_name}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {booking.port_name} · {booking.shipping_line_name}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-white/80 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950/40">
            <CalendarDays className="h-5 w-5 text-[var(--admin-accent)]" strokeWidth={2} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Escala
              </p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {formatIsoDateLabel(booking.call_date, "long")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--admin-accent)]/8 px-3 py-2.5">
          <Hash className="h-4 w-4 shrink-0 text-[var(--admin-accent)]" strokeWidth={2} />
          <code className="truncate text-sm font-semibold text-[var(--admin-accent)]">
            {booking.booking_code}
          </code>
        </div>
      </div>
    </div>
  );
}
