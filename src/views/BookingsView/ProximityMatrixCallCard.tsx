"use client";

import Link from "next/link";
import { Clock3, Ruler } from "lucide-react";
import CatalogLogoThumb from "@/components/ui/CatalogLogoThumb";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import ConflictTypeChips from "@/components/booking/ConflictTypeChips";
import {
  conflictCallCardFrameSeverity,
  conflictChipTitle,
} from "@/lib/conflictDisplayFromApi";
import { formatTimeShort } from "@/lib/bookingDisplay";
import {
  conflictCardClassName,
  conflictFieldHighlightClassName,
} from "@/lib/bookingConflictStyle";
import type { VesselProximityMatrixCell } from "@/services/bookings/vesselProximityMatrixService";
import {
  BOOKING_DETAIL_LINK_PROPS,
  bookingDetailHref,
  type BookingBadgeStatus,
  type BookingConflictSeverity,
} from "@/types/booking";

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

type ProximityMatrixCallCardProps = {
  cell: VesselProximityMatrixCell;
  returnTo: string;
  /** Extra vertical room when the matrix has many date rows. */
  spacious?: boolean;
};

export default function ProximityMatrixCallCard({
  cell,
  returnTo,
  spacious = false,
}: ProximityMatrixCallCardProps) {
  const badgeStatus = asBadgeStatus(cell.status);
  const highlights = cell.conflict_highlights;
  const frameSeverity = conflictCallCardFrameSeverity(highlights);
  const conflictTitle = conflictChipTitle(cell.conflict_chips);

  return (
    <Link
      href={bookingDetailHref(
        { booking_code: cell.booking_code },
        { returnTo },
      )}
      {...BOOKING_DETAIL_LINK_PROPS}
      className={conflictCardClassName(
        frameSeverity,
        [
          "block rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:border-[var(--admin-accent)]/40 hover:bg-[var(--admin-accent)]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-accent)] dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-[var(--admin-accent)]/50",
          spacious ? "p-3" : "p-2.5",
        ].join(" "),
      )}
      title={`Editar ${cell.booking_code}${conflictTitle ? ` · ${conflictTitle}` : ""}`}
      aria-label={`Abrir reserva ${cell.booking_code}`}
    >
      <div className="flex min-w-0 items-start gap-2">
        <CatalogLogoThumb
          src={cell.vessel_logo}
          alt=""
          size="sm"
          kind="vessel"
        />
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">
              {cell.vessel_name}
            </p>
            {badgeStatus ? (
              <BookingStatusBadge status={badgeStatus} size="sm" />
            ) : null}
            <ConflictTypeChips chips={cell.conflict_chips} />
          </div>
          <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
            {cell.shipping_line_name}
          </p>
        </div>
      </div>
      <div className="mt-2 border-t border-zinc-100 pt-2 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-3">
          {cell.loa_m ? (
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
              {Number(cell.loa_m).toLocaleString("es-MX")} m
            </span>
          ) : (
            <span />
          )}
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
            {formatTimeShort(cell.eta)}–{formatTimeShort(cell.etd)}
          </p>
        </div>
      </div>
    </Link>
  );
}
