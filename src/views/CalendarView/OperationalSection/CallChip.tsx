"use client";

import Link from "next/link";
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
  const brand =
    booking.shipping_line_code?.split("_")[0]?.toUpperCase().slice(0, 4) ||
    booking.shipping_line_name.slice(0, 4).toUpperCase();

  return (
    <Link
      href={bookingDetailHref(booking)}
      className={[
        "block rounded-md px-1.5 py-1 text-left text-[10px] leading-tight shadow-sm transition hover:opacity-90 sm:text-[11px]",
        CORP_CHIP_CLASS[corp],
        booking.status === "h" ? "ring-2 ring-amber-300 ring-offset-1" : "",
        booking.status === "c" ? "opacity-50 line-through" : "",
      ].join(" ")}
      title={`${booking.shipping_line_name} · ${booking.vessel_name} · ${bookingStatusLabel(booking.status)}`}
    >
      <span className="font-semibold">{brand}</span>{" "}
      <span className="font-medium">{booking.vessel_name}</span>
      {!compact ? (
        <span className="mt-0.5 block opacity-90">
          {formatLoa(booking.vessel_loa_m)} · {formatTimeShort(booking.eta)}–
          {formatTimeShort(booking.etd)}
        </span>
      ) : null}
    </Link>
  );
}
