"use client";

import { Anchor, LayoutGrid, MapPin, Ship } from "lucide-react";
import type { CalendarDayBooking } from "./types";

type CalendarOccupancyCardProps = {
  booking: CalendarDayBooking;
};

function cardTone(booking: CalendarDayBooking): string {
  if (booking.blocksSelection) {
    return "border-amber-300/90 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 shadow-amber-100/50 dark:border-amber-800/70 dark:from-amber-950/40 dark:via-zinc-900 dark:to-amber-950/20";
  }
  if (!booking.isCurrentPort) {
    return "border-violet-200/90 bg-gradient-to-br from-violet-50/80 via-white to-violet-50/30 shadow-violet-100/40 dark:border-violet-900/60 dark:from-violet-950/30 dark:via-zinc-900 dark:to-violet-950/15";
  }
  return "border-zinc-200/90 bg-gradient-to-br from-white via-zinc-50/50 to-[var(--admin-accent)]/[0.04] shadow-zinc-100/60 dark:border-zinc-700 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950";
}

function statusBadgeClass(booking: CalendarDayBooking): string {
  if (booking.blocksSelection) {
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200";
  }
  if (!booking.isCurrentPort) {
    return "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200";
  }
  return "bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]";
}

export default function CalendarOccupancyCard({ booking }: CalendarOccupancyCardProps) {
  return (
    <article
      className={[
        "overflow-hidden rounded-2xl border shadow-[var(--admin-card-shadow)]",
        cardTone(booking),
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3 border-b border-inherit/60 px-4 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
            <Ship className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {booking.vessel_name}
            </h4>
            <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
              {booking.shipping_line_name}
            </p>
          </div>
        </div>
        <span
          className={[
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
            statusBadgeClass(booking),
          ].join(" ")}
        >
          {booking.status_display}
        </span>
      </div>

      <div className="space-y-2 px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 dark:bg-zinc-950/40">
          <MapPin className="h-4 w-4 shrink-0 text-[var(--admin-accent)]" strokeWidth={2} />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Puerto
            </p>
            <p className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {booking.port_name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-zinc-950/40">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Naviera
            </p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs font-medium text-zinc-700 dark:text-zinc-200">
              <Anchor className="h-3 w-3 shrink-0 text-zinc-400" strokeWidth={2} />
              {booking.shipping_line_name}
            </p>
          </div>
          <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-zinc-950/40">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Posición
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-200">
              <LayoutGrid className="h-3 w-3 shrink-0 text-zinc-400" strokeWidth={2} />
              {booking.position_code ?? "Sin asignar"}
            </p>
          </div>
        </div>

        <code className="block truncate rounded-lg bg-zinc-100/90 px-2.5 py-1.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {booking.booking_code}
        </code>

        {booking.blocksSelection ? (
          <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-2.5 py-1.5 text-xs font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            No disponible para el barco que estás reservando
          </p>
        ) : null}

        {!booking.isCurrentPort ? (
          <p className="rounded-lg border border-violet-200/80 bg-violet-50/90 px-2.5 py-1.5 text-xs font-medium text-violet-800 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-200">
            Este barco tiene escala en otro puerto este día
          </p>
        ) : null}
      </div>
    </article>
  );
}
