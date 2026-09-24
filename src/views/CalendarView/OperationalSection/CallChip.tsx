"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import BookingMetaRow from "@/components/booking/BookingMetaRow";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import ConflictTypeChips from "@/components/booking/ConflictTypeChips";
import FirstArrivalBadge from "@/components/booking/FirstArrivalBadge";
import {
  conflictCallCardFrameSeverity,
  conflictChipTitle,
  conflictChipsFromApi,
  conflictHighlightsFromApi,
} from "@/lib/conflictDisplayFromApi";
import { currentReturnTo } from "@/lib/safeReturnTo";
import {
  BOOKING_DETAIL_LINK_PROPS,
  bookingDetailHref,
  bookingStatusLabel,
  type BookingListItem,
} from "@/types/booking";
import {
  conflictChipClassName,
} from "@/lib/bookingConflictStyle";
import ShippingLineCaption, {
  shippingLineWithGroupLabel,
} from "@/components/ui/ShippingLineCaption";
import {
  CORP_CHIP_CLASS,
  corpKeyFromShippingLineCode,
} from "../corpColors";

type CallChipProps = {
  booking: BookingListItem;
  /** Dense meta — calendar month cells. */
  compact?: boolean;
  /**
   * Soft focus: muted when false. Used for vessel / shipping-line sidebar
   * filters so neighbors stay visible.
   */
  focused?: boolean;
};

export default function CallChip({
  booking,
  compact = false,
  focused = true,
}: CallChipProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const corp = corpKeyFromShippingLineCode(booking.shipping_line_code);
  const lineLabel = shippingLineWithGroupLabel(
    booking.shipping_line_name,
    booking.shipping_line_group_name,
  );
  const positionLabel = booking.position_code || "Sin asignar";
  const highlights = conflictHighlightsFromApi(booking);
  const chips = conflictChipsFromApi(booking);
  const chipTitle = conflictChipTitle(chips);
  const frameSeverity = conflictCallCardFrameSeverity(highlights);

  return (
    <Link
      href={bookingDetailHref(booking, {
        returnTo: currentReturnTo(pathname, searchParams),
      })}
      {...BOOKING_DETAIL_LINK_PROPS}
      className={[
        "block min-w-0 rounded-md px-1.5 py-1 text-left text-[10px] leading-tight shadow-sm transition hover:opacity-90 sm:text-[11px]",
        CORP_CHIP_CLASS[corp],
        booking.status === "h" ? "ring-2 ring-amber-300 ring-offset-1" : "",
        highlights.frame_card
          ? conflictChipClassName(frameSeverity)
          : "",
        booking.status === "c" ? "opacity-50 line-through" : "",
        !focused ? "opacity-55 hover:opacity-80" : "",
      ].join(" ")}
      title={`${lineLabel} · ${booking.vessel_name} · ${booking.port_name} · ${positionLabel} · ${bookingStatusLabel(booking.status)}${booking.first_arrival ? " · Primer arribo" : ""}${chipTitle ? ` · ${chipTitle}` : ""}${!focused ? " · vecino" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="flex min-w-0 items-start justify-between gap-1">
        <span className="min-w-0 truncate font-semibold">
          {booking.vessel_name}
        </span>
        <BookingStatusBadge
          status={booking.status}
          size="sm"
          className="shrink-0"
        />
      </span>
      <ShippingLineCaption
        name={booking.shipping_line_name}
        groupName={booking.shipping_line_group_name}
        nameClassName={
          compact
            ? "truncate text-[9px] font-medium opacity-90"
            : "truncate text-[10px] font-medium opacity-90"
        }
        groupClassName={
          compact
            ? "truncate text-[9px] opacity-75"
            : "mt-px truncate text-[10px] opacity-75"
        }
      />
      {booking.first_arrival || chips.length > 0 ? (
        <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-1">
          {booking.first_arrival ? <FirstArrivalBadge compact /> : null}
          <ConflictTypeChips chips={chips} />
        </span>
      ) : null}
      <BookingMetaRow
        className="mt-0.5"
        compact={compact}
        tone="muted"
        loaM={booking.vessel_loa_m}
        eta={booking.eta}
        etd={booking.etd}
        actualPax={booking.actual_pax}
        plannedPax={booking.planned_pax}
        positionLabel={positionLabel}
        highlightLoa={highlights.highlight_loa}
        loaHighlightSeverity={highlights.loa_severity}
        highlightSchedule={highlights.highlight_schedule}
        scheduleHighlightSeverity={highlights.schedule_severity}
        highlightPosition={highlights.highlight_position}
        positionHighlightSeverity={highlights.position_severity}
      />
    </Link>
  );
}
