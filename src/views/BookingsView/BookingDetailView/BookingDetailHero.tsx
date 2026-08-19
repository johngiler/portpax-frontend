"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import BookingCodeRef from "@/components/booking/BookingCodeRef";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import ConflictTypeChips from "@/components/booking/ConflictTypeChips";
import {
  conflictChipsFromApi,
} from "@/lib/conflictDisplayFromApi";
import { returnToLabel, sanitizeReturnTo } from "@/lib/safeReturnTo";
import type { Booking } from "@/types/booking";

type BookingDetailHeroProps = {
  booking: Booking;
};

export default function BookingDetailHero({ booking }: BookingDetailHeroProps) {
  const searchParams = useSearchParams();
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));
  const backHref = returnTo ?? "/bookings";
  const backLabel = returnToLabel(returnTo);
  const chips = conflictChipsFromApi(booking);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="border-b border-zinc-200/80 bg-gradient-to-r from-[var(--admin-accent)]/12 via-[var(--admin-accent)]/5 to-transparent px-5 py-4 dark:border-zinc-800">
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-[var(--admin-accent)] dark:text-zinc-400"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          {backLabel}
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <BookingStatusBadge status={booking.status} className="text-xs" />
          <ConflictTypeChips chips={chips} size="md" />
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

        <BookingCodeRef
          code={booking.booking_code}
          pdfHref={booking.confirmation_pdf_url}
          className="mt-4"
        />
      </div>
    </div>
  );
}
