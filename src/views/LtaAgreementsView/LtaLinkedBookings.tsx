"use client";

import { ExternalLink, Link2 } from "lucide-react";
import Link from "next/link";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import { useLtaLinkedBookings } from "@/hooks/swr/useLtaLinkedBookings";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { bookingDetailHref } from "@/types/booking";

const RETURN_TO = "/lta";

type LtaLinkedBookingsProps = {
  agreementId: number;
  /** Only fetch while the accordion row is open. */
  active: boolean;
};

export default function LtaLinkedBookings({
  agreementId,
  active,
}: LtaLinkedBookingsProps) {
  const { bookings, totalCount, isLoading, error } = useLtaLinkedBookings(
    agreementId,
    active,
  );

  const errorMessage = error
    ? getApiErrorMessage(error, "No se pudieron cargar las reservas vinculadas.")
    : null;

  return (
    <div className="mt-4 rounded-xl border border-zinc-200/70 bg-white/90 p-3.5 shadow-sm dark:border-zinc-700/60 dark:bg-zinc-900/70">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        <Link2 className="h-3.5 w-3.5" strokeWidth={2} />
        Reservas vinculadas
        {!isLoading && !errorMessage ? (
          <span className="font-medium normal-case tracking-normal text-zinc-500">
            ({totalCount})
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Cargando reservas…</p>
      ) : errorMessage ? (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      ) : bookings.length === 0 ? (
        <p className="text-sm font-normal text-zinc-400">
          Ninguna reserva vinculada todavía.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <Link
                href={bookingDetailHref(booking, { returnTo: RETURN_TO })}
                className="group -mx-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg px-1.5 py-2.5 text-sm transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
              >
                <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-[var(--admin-accent)] group-hover:underline">
                  {booking.booking_code}
                  <ExternalLink
                    className="h-3 w-3 shrink-0 opacity-60"
                    strokeWidth={2}
                  />
                </span>
                <span className="text-zinc-600 dark:text-zinc-300">
                  {formatIsoDateLabel(booking.call_date, "short")}
                </span>
                <span className="truncate text-zinc-500">
                  {booking.vessel_name}
                  {booking.position_code ? ` · ${booking.position_code}` : ""}
                </span>
                <BookingStatusBadge
                  status={booking.status}
                  className="ml-auto"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!isLoading && !errorMessage && totalCount > bookings.length ? (
        <p className="mt-2 text-xs text-zinc-400">
          Mostrando {bookings.length} de {totalCount}. Abre el detalle para ver el resto.
        </p>
      ) : null}
    </div>
  );
}
