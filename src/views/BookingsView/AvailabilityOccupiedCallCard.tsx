"use client";

import Link from "next/link";
import { Anchor, Clock3, Ruler, Users } from "lucide-react";
import CatalogLogoThumb from "@/components/ui/CatalogLogoThumb";
import ShippingLineCaption from "@/components/ui/ShippingLineCaption";
import { formatTimeShort } from "@/lib/bookingDisplay";
import { cardPaxTitle, formatCardPax } from "@/lib/bookingPaxDisplay";
import ConflictTypeChips from "@/components/booking/ConflictTypeChips";
import {
  conflictCallCardFrameSeverity,
  conflictChipTitle,
  conflictChipsFromApi,
  conflictHighlightsFromApi,
} from "@/lib/conflictDisplayFromApi";
import {
  conflictCardClassName,
  conflictFieldHighlightClassName,
} from "@/lib/bookingConflictStyle";
import type { BookingConflictSeverity } from "@/types/booking";
import type { AvailabilityBookingCall } from "@/services/bookings/bookingService";
import {
  BOOKING_DETAIL_LINK_PROPS,
  bookingDetailHref,
  type BookingBadgeStatus,
} from "@/types/booking";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import FirstArrivalBadge from "@/components/booking/FirstArrivalBadge";
import {
  availabilityFocusNeighborTitle,
  type AvailabilityFocusFilters,
} from "./availabilityCallFilter";

const BOOKING_BADGE_STATUSES = new Set<string>([
  "nr",
  "h",
  "co",
  "cl",
  "lta",
  "ltd",
  "r",
  "c",
]);

function asBadgeStatus(value: string | undefined): BookingBadgeStatus | null {
  if (!value || !BOOKING_BADGE_STATUSES.has(value)) return null;
  return value as BookingBadgeStatus;
}

type Props = {
  call: AvailabilityBookingCall;
  hideCarrierIdentity: boolean;
  matchesFilter: boolean;
  returnTo: string | null;
  rowDate: string;
  todayIso: string;
  focus: AvailabilityFocusFilters;
};

export default function AvailabilityOccupiedCallCard({
  call,
  hideCarrierIdentity,
  matchesFilter,
  returnTo,
  rowDate,
  todayIso,
  focus,
}: Props) {
  const badgeStatus = asBadgeStatus(call.status);
  const highlights = conflictHighlightsFromApi(call);
  const chips = conflictChipsFromApi(call);
  const frameSeverity = conflictCallCardFrameSeverity(highlights);
  const chipTitle = conflictChipTitle(chips);
  const loaLabel = call.loa_m
    ? `${Number(call.loa_m).toLocaleString("es-MX")} m`
    : null;

  return (
    <Link
      href={bookingDetailHref({ booking_code: call.booking_code }, { returnTo })}
      {...BOOKING_DETAIL_LINK_PROPS}
      className={[
        conflictCardClassName(
          frameSeverity,
          "block rounded-lg border bg-white p-2.5 shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-accent)] dark:bg-zinc-900",
        ),
        matchesFilter
          ? "border-zinc-200 hover:border-[var(--admin-accent)]/40 hover:bg-[var(--admin-accent)]/5 dark:border-zinc-700 dark:hover:border-[var(--admin-accent)]/50"
          : "border-zinc-200/80 opacity-55 hover:opacity-80 dark:border-zinc-700/80",
      ].join(" ")}
      title={
        hideCarrierIdentity
          ? "Posición asignada"
          : matchesFilter
            ? `Editar ${call.booking_code}${chipTitle ? ` · ${chipTitle}` : ""}`
            : availabilityFocusNeighborTitle(call, rowDate, focus, todayIso)
      }
      aria-label={
        hideCarrierIdentity
          ? "Abrir reserva · posición asignada"
          : `Abrir reserva ${call.booking_code}`
      }
    >
      {hideCarrierIdentity ? (
        <div className="flex min-w-0 items-start gap-2">
          <Anchor
            className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400"
            strokeWidth={1.75}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
              Posición asignada
            </p>
          </div>
        </div>
      ) : (
        <div className="flex min-w-0 items-start gap-2">
          <CatalogLogoThumb
            src={call.vessel_logo}
            alt=""
            size="sm"
            kind="vessel"
          />
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                {call.vessel_name}
              </p>
              {badgeStatus ? (
                <BookingStatusBadge status={badgeStatus} size="sm" />
              ) : null}
              {call.first_arrival ? <FirstArrivalBadge compact /> : null}
              <ConflictTypeChips chips={chips} />
            </div>
            <ShippingLineCaption
              name={call.shipping_line_name}
              groupName={call.shipping_line_group_name}
              nameClassName="truncate text-[11px] font-medium text-zinc-600 dark:text-zinc-300"
              groupClassName="truncate text-[11px] text-zinc-500 dark:text-zinc-400"
            />
          </div>
        </div>
      )}
      <div className="mt-2 space-y-1.5 border-t border-zinc-100 pt-2 dark:border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          {loaLabel ? (
            <span
              className={[
                "inline-flex min-w-0 items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400",
                highlights.highlight_loa
                  ? conflictFieldHighlightClassName(
                      (highlights.loa_severity as BookingConflictSeverity) ??
                        "yellow",
                    )
                  : "",
              ].join(" ")}
            >
              <Ruler className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {loaLabel}
            </span>
          ) : (
            <span />
          )}
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
            title={
              hideCarrierIdentity
                ? "PAX"
                : cardPaxTitle(call.actual_pax, call.planned_pax)
            }
          >
            <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {formatCardPax(call.actual_pax, call.planned_pax)}
          </span>
          <p
            className={[
              "inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400",
              highlights.highlight_schedule
                ? conflictFieldHighlightClassName(
                    (highlights.schedule_severity as BookingConflictSeverity) ??
                      "yellow",
                  )
                : "",
            ].join(" ")}
          >
            <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {formatTimeShort(call.eta)}–{formatTimeShort(call.etd)}
          </p>
        </div>
      </div>
    </Link>
  );
}
