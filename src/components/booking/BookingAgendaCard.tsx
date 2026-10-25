"use client";

import { ChevronRight, MapPin } from "lucide-react";
import InAppLink from "@/components/ui/InAppLink";
import BookingMetaRow from "@/components/booking/BookingMetaRow";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import ConflictTypeChips from "@/components/booking/ConflictTypeChips";
import FirstArrivalBadge from "@/components/booking/FirstArrivalBadge";
import { shippingLineWithGroupLabel } from "@/components/ui/ShippingLineCaption";
import {
  conflictChipsFromApi,
  conflictHighlightsFromApi,
  conflictListFrameSeverity,
} from "@/lib/conflictDisplayFromApi";
import { currentReturnTo } from "@/lib/safeReturnTo";
import { usePathname, useSearchParams } from "next/navigation";
import { conflictCardClassName } from "@/lib/bookingConflictStyle";
import {
  bookingDetailHref,
  getBookingBadgeStatus,
  type BookingListItem,
} from "@/types/booking";

type BookingAgendaCardProps = {
  booking: BookingListItem;
  /** Soft-focus neighbor (muted, still tappable). */
  focused?: boolean;
  showPort?: boolean;
};

/** List-parity call card for mobile calendar agenda / day sheet. */
export default function BookingAgendaCard({
  booking,
  focused = true,
  showPort = true,
}: BookingAgendaCardProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = currentReturnTo(pathname, searchParams);
  const detailHref = bookingDetailHref(booking, { returnTo });
  const positionLabel = booking.position_code || "Sin asignar";
  const highlights = conflictHighlightsFromApi(booking);
  const chips = conflictChipsFromApi(booking);
  const lineLabel = shippingLineWithGroupLabel(
    booking.shipping_line_name,
    booking.shipping_line_group_name,
  );
  const cancelled = booking.status === "c";

  return (
    <InAppLink
      href={detailHref}
      className={conflictCardClassName(
        conflictListFrameSeverity(highlights),
        [
          "block rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80",
          cancelled ? "opacity-50" : focused ? "" : "opacity-55",
        ]
          .filter(Boolean)
          .join(" "),
      )}
      aria-label={`Abrir reserva ${booking.booking_code}`}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="truncate text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
            {booking.vessel_name}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <BookingStatusBadge
              status={getBookingBadgeStatus(booking)}
              size="sm"
            />
            {booking.first_arrival ? <FirstArrivalBadge /> : null}
            <ConflictTypeChips chips={chips} />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5 text-xs leading-snug text-zinc-600 dark:text-zinc-300">
            {showPort ? (
              <span className="flex min-w-0 items-center gap-1">
                <MapPin
                  className="h-3.5 w-3.5 shrink-0 text-zinc-400"
                  aria-hidden
                />
                <span className="truncate font-medium text-zinc-700 dark:text-zinc-200">
                  {booking.port_name}
                </span>
              </span>
            ) : null}
            <span className={showPort ? "truncate pl-5 text-zinc-500" : "truncate"}>
              {lineLabel}
            </span>
          </div>
        </div>
        <ChevronRight
          className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300"
          strokeWidth={2}
          aria-hidden
        />
      </div>
      <div className="mt-3">
        <BookingMetaRow
          layout="grid"
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
      </div>
      <p className="mt-2 truncate font-mono text-[10px] font-medium tracking-wide text-zinc-400">
        {booking.booking_code}
      </p>
    </InAppLink>
  );
}
