"use client";

import { Anchor, CalendarDays, MapPin, Ship } from "lucide-react";
import type { ReactNode } from "react";
import CatalogLogoThumb from "@/components/ui/CatalogLogoThumb";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import type { Booking } from "@/types/booking";

type SummaryItemProps = {
  icon: typeof MapPin;
  label: string;
  children: ReactNode;
};

function SummaryItem({ icon: Icon, label, children }: SummaryItemProps) {
  return (
    <div className="flex gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
        <div className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {children}
        </div>
      </div>
    </div>
  );
}

type BookingDetailSummaryProps = {
  booking: Booking;
};

export default function BookingDetailSummary({ booking }: BookingDetailSummaryProps) {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Detalle de escala</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryItem icon={MapPin} label="Puerto">
          <div className="flex items-center gap-2">
            <CatalogLogoThumb
              src={booking.port_logo}
              alt=""
              size="xs"
              kind="port"
            />
            <span className="truncate">{booking.port_name}</span>
          </div>
          <p className="mt-0.5 text-xs font-normal text-zinc-500">{booking.port_code}</p>
        </SummaryItem>
        <SummaryItem icon={Anchor} label="Naviera">
          <div className="flex items-center gap-2">
            <CatalogLogoThumb
              src={booking.shipping_line_logo}
              alt=""
              size="xs"
              kind="shipping_line"
            />
            <span className="truncate">{booking.shipping_line_name}</span>
          </div>
          <p className="mt-0.5 text-xs font-normal text-zinc-500">{booking.shipping_line_code}</p>
        </SummaryItem>
        <SummaryItem icon={Ship} label="Barco">
          <div className="flex items-center gap-2">
            <CatalogLogoThumb
              src={booking.vessel_logo}
              alt=""
              size="xs"
              kind="vessel"
            />
            <span className="truncate">{booking.vessel_name}</span>
          </div>
        </SummaryItem>
        <SummaryItem icon={CalendarDays} label="Fecha de escala">
          <span>{formatIsoDateLabel(booking.call_date, "long")}</span>
          {booking.position_code ? (
            <p className="mt-0.5 text-xs font-normal text-zinc-500">
              Posición {booking.position_code}
            </p>
          ) : null}
        </SummaryItem>
      </div>

      {booking.notes ? (
        <div className="mt-4 rounded-xl border border-zinc-200/80 bg-zinc-50/40 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950/30">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Notas</p>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">{booking.notes}</p>
        </div>
      ) : null}
    </section>
  );
}
