"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import BookingMetaRow from "@/components/booking/BookingMetaRow";
import { currentReturnTo } from "@/lib/safeReturnTo";
import {
  bookingDetailHref,
  bookingStatusLabel,
  type Booking,
} from "@/types/booking";
import { CORP_CHIP_CLASS, corpKeyFromShippingLineCode } from "../corpColors";

type CallChipProps = {
  booking: Booking;
  /** Dense meta — calendar month cells. */
  compact?: boolean;
};

export default function CallChip({ booking, compact = false }: CallChipProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const corp = corpKeyFromShippingLineCode(booking.shipping_line_code);
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
        booking.status === "c" ? "opacity-50 line-through" : "",
      ].join(" ")}
      title={`${booking.shipping_line_name} · ${booking.vessel_name} · ${booking.port_name} · ${positionLabel} · ${bookingStatusLabel(booking.status)}`}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="block truncate font-semibold">{booking.vessel_name}</span>
      <span className="mt-0.5 block truncate opacity-90">{booking.port_name}</span>
      <BookingMetaRow
        className="mt-0.5"
        compact={compact}
        tone="onColor"
        loaM={booking.vessel_loa_m}
        eta={booking.eta}
        etd={booking.etd}
        positionLabel={positionLabel}
      />
    </Link>
  );
}
