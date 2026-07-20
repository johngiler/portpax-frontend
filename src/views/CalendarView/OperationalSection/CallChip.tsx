"use client";

import Link from "next/link";
import { Ship } from "lucide-react";
import CatalogLogoThumb from "@/components/ui/CatalogLogoThumb";
import {
  bookingDetailHref,
  bookingStatusLabel,
  type Booking,
} from "@/types/booking";
import { CORP_CHIP_CLASS, corpKeyFromShippingLineCode } from "../corpColors";
import { formatLoa, formatTimeShort } from "./calendarOpsUtils";

type CallChipProps = {
  booking: Booking;
  compact?: boolean;
};

export default function CallChip({ booking, compact = false }: CallChipProps) {
  const corp = corpKeyFromShippingLineCode(booking.shipping_line_code);
  const logo = booking.shipping_line_logo || booking.vessel_logo;
  const positionLabel = booking.position_code || "Sin asignar";
  const placeLine = `${booking.port_name} · ${positionLabel}`;

  return (
    <Link
      href={bookingDetailHref(booking)}
      className={[
        "flex items-start gap-1.5 rounded-md px-1.5 py-1 text-left leading-tight shadow-sm transition hover:opacity-90",
        compact ? "text-[10px] sm:text-[11px]" : "text-[10px] sm:text-[11px]",
        CORP_CHIP_CLASS[corp],
        booking.status === "h" ? "ring-2 ring-amber-300 ring-offset-1" : "",
        booking.status === "c" ? "opacity-50 line-through" : "",
      ].join(" ")}
      title={`${booking.shipping_line_name} · ${booking.vessel_name} · ${placeLine} · ${bookingStatusLabel(booking.status)}`}
      onClick={(e) => e.stopPropagation()}
    >
      <CatalogLogoThumb
        src={logo}
        alt=""
        size={compact ? "xs" : "sm"}
        fallbackIcon={Ship}
        className="mt-0.5 border-white/40 bg-white/90 dark:border-zinc-700 dark:bg-zinc-900/90"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{booking.vessel_name}</span>
        <span className="mt-0.5 block truncate opacity-90">{placeLine}</span>
        {!compact ? (
          <span className="mt-0.5 block truncate opacity-80">
            {formatLoa(booking.vessel_loa_m)} · {formatTimeShort(booking.eta)}–
            {formatTimeShort(booking.etd)}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
