"use client";

import Link from "next/link";
import { ChevronRight, Ship } from "lucide-react";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import { formatIsoDateLabel, parseIsoDate } from "@/lib/bookingDates";
import { bookingDetailHref, type Booking } from "@/types/booking";
import { portAccentColor } from "./portColors";

type OccupancyDayPanelProps = {
  dateIso: string | null;
  bookings: Booking[];
  dateFrom: string;
  dateTo: string;
};

function DateHero({ dateIso }: { dateIso: string }) {
  const { day, monthIndex, year } = parseIsoDate(dateIso);
  const weekday = new Date(year, monthIndex, day).toLocaleDateString("es-MX", {
    weekday: "long",
  });
  const month = new Date(year, monthIndex, 1).toLocaleDateString("es-MX", { month: "long" });

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--admin-accent)] to-[#1e5a8a] p-5 text-white shadow-lg shadow-[var(--admin-accent)]/25">
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Detalle del día</p>
      <p className="mt-2 text-4xl font-bold leading-none">{day}</p>
      <p className="mt-1 capitalize text-sm font-medium text-white/90">
        {weekday}, {month} {year}
      </p>
    </div>
  );
}

export default function OccupancyDayPanel({
  dateIso,
  bookings,
  dateFrom,
  dateTo,
}: OccupancyDayPanelProps) {
  if (!dateIso) {
    return (
      <div className="flex h-full min-h-[20rem] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300/80 bg-zinc-50/50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-950/30">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
          <Ship className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <p className="mt-4 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Selecciona un día en el calendario
        </p>
        <p className="mt-2 max-w-xs text-sm text-zinc-500">
          Explora escalas entre {formatIsoDateLabel(dateFrom, "short")} y{" "}
          {formatIsoDateLabel(dateTo, "short")}.
        </p>
      </div>
    );
  }

  const active = bookings.filter((booking) => booking.status !== "cancelled");
  const cancelled = bookings.filter((booking) => booking.status === "cancelled");

  return (
    <div className="flex h-full flex-col gap-4">
      <DateHero dateIso={dateIso} />

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {active.length} activa{active.length === 1 ? "" : "s"}
          {cancelled.length > 0 ? ` · ${cancelled.length} cancelada${cancelled.length === 1 ? "" : "s"}` : ""}
        </p>
        <Link
          href="/bookings"
          className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-[var(--admin-accent)] hover:underline"
        >
          Ver todas
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-6 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Día libre</p>
          <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-400/80">
            Sin escalas registradas en este día.
          </p>
        </div>
      ) : (
        <ul className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <Link
                href={bookingDetailHref(booking)}
                className="group flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200/80 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-[var(--admin-accent)]/30 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
              >
                <span
                  className="h-10 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: portAccentColor(booking.port) }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {booking.vessel_name}
                    </p>
                    <BookingStatusBadge status={booking.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {booking.port_name} · {booking.shipping_line_name}
                  </p>
                  {booking.position_code ? (
                    <p className="mt-1 font-mono text-[10px] text-zinc-400">{booking.position_code}</p>
                  ) : null}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-[var(--admin-accent)]" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
