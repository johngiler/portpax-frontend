"use client";

import { ExternalLink, Link2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import { getApiErrorMessage } from "@/lib/apiFormErrors";
import { fetchBookings } from "@/services/bookings/bookingService";
import { bookingDetailHref, type Booking } from "@/types/booking";

const PAGE_SIZE = 50;
const RETURN_TO = "/lta";

type LtaLinkedBookingsProps = {
  agreementId: number;
  /** Only fetch while the accordion row is open. */
  active: boolean;
  /** Bump after linking to refresh the list. */
  refreshKey?: number;
};

export default function LtaLinkedBookings({
  agreementId,
  active,
  refreshKey = 0,
}: LtaLinkedBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const data = await fetchBookings({
          long_term_agreement: agreementId,
          page: 1,
          pageSize: PAGE_SIZE,
          ordering: "call_date",
        });
        if (cancelled) return;
        setBookings(data.results);
        setTotal(data.count);
      } catch (err) {
        if (cancelled) return;
        setBookings([]);
        setTotal(0);
        setError(
          getApiErrorMessage(err, "No se pudieron cargar las reservas vinculadas."),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, agreementId, refreshKey]);

  return (
    <div className="mt-4 rounded-xl border border-zinc-200/70 bg-white/90 p-3.5 shadow-sm dark:border-zinc-700/60 dark:bg-zinc-900/70">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        <Link2 className="h-3.5 w-3.5" strokeWidth={2} />
        Reservas vinculadas
        {!loading && !error ? (
          <span className="font-medium normal-case tracking-normal text-zinc-500">
            ({total})
          </span>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando reservas…</p>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
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
                className="group flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5 text-sm transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 -mx-1.5 px-1.5 rounded-lg"
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

      {!loading && !error && total > bookings.length ? (
        <p className="mt-2 text-xs text-zinc-400">
          Mostrando {bookings.length} de {total}. Abre el detalle para ver el resto.
        </p>
      ) : null}
    </div>
  );
}
