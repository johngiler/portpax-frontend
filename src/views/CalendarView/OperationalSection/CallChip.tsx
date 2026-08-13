"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import BookingMetaRow from "@/components/booking/BookingMetaRow";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import { currentReturnTo } from "@/lib/safeReturnTo";
import {
  bookingDetailHref,
  bookingStatusLabel,
  type Booking,
} from "@/types/booking";
import { conflictChipClassName } from "@/lib/bookingConflictStyle";
import {
  CORP_CHIP_CLASS,
  CORP_SHORT_LABEL,
  corpKeyFromShippingLineCode,
} from "../corpColors";

type CallChipProps = {
  booking: Booking;
  /** Dense meta — calendar month cells. */
  compact?: boolean;
};

export default function CallChip({ booking, compact = false }: CallChipProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const corp = corpKeyFromShippingLineCode(booking.shipping_line_code);
  const corpLabel = CORP_SHORT_LABEL[corp];
  const positionLabel = booking.position_code || "Sin asignar";

  return (
    <Link
      href={bookingDetailHref(booking, {
        returnTo: currentReturnTo(pathname, searchParams),
      })}
      className={[
        "block min-w-0 rounded-md px-1.5 py-1 text-left text-[10px] leading-tight shadow-sm transition hover:opacity-90 sm:text-[11px]",
        CORP_CHIP_CLASS[corp],
        booking.status === "h" ? "ring-2 ring-amber-300 ring-offset-1" : "",
        conflictChipClassName(booking.has_conflict),
        booking.status === "c" ? "opacity-50 line-through" : "",
      ].join(" ")}
      title={`${corpLabel} · ${booking.shipping_line_name} · ${booking.vessel_name} · ${booking.port_name} · ${positionLabel} · ${bookingStatusLabel(booking.status)}${booking.has_conflict ? " · Conflicto" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="flex min-w-0 items-baseline justify-between gap-1">
        <span className="truncate font-semibold">{booking.vessel_name}</span>
        <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide opacity-90 sm:text-[10px]">
          {corpLabel}
        </span>
      </span>
      <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-1">
        <BookingStatusBadge status={booking.status} size="sm" />
        {booking.has_conflict ? (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-red-800 dark:text-red-200">
            <AlertTriangle className="h-2.5 w-2.5" aria-hidden />
            Conflicto
          </span>
        ) : null}
      </span>
      <BookingMetaRow
        className="mt-0.5"
        compact={compact}
        tone="muted"
        loaM={booking.vessel_loa_m}
        eta={booking.eta}
        etd={booking.etd}
        positionLabel={positionLabel}
      />
    </Link>
  );
}
