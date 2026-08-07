"use client";

import type { PositionOccupant } from "@/types/booking";
import { bookingDetailHref } from "@/types/booking";
import {
  occupantDateLabel,
  positionOccupancyHintFromOccupant,
} from "@/lib/positionOccupancyHint";
import { BOOKING_STATUS_LABELS, type BookingStatus } from "@/types/booking";

type PositionOccupancyHintProps = {
  message?: string | null;
  occupant?: PositionOccupant | null;
  /** Fallback when occupant has no position_code. */
  positionCode?: string | null;
  /** Fallback when occupant has no call_date. */
  callDate?: string | null;
  className?: string;
};

export default function PositionOccupancyHint({
  message = null,
  occupant = null,
  positionCode = null,
  callDate = null,
  className = "",
}: PositionOccupancyHintProps) {
  if (!occupant && !message) return null;

  const posLabel = occupant?.position_code || positionCode || null;
  const dateLabel = occupantDateLabel(occupant?.call_date || callDate);

  if (occupant?.booking_code || posLabel) {
    const statusLabel = occupant?.status
      ? BOOKING_STATUS_LABELS[occupant.status as BookingStatus] ||
        occupant.status.toUpperCase()
      : null;
    const href = occupant?.booking_code
      ? bookingDetailHref({ booking_code: occupant.booking_code })
      : null;
    return (
      <p
        className={[
          "mt-1.5 text-xs leading-snug text-amber-700 dark:text-amber-400",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {posLabel ? (
          <>
            <span className="font-semibold">{posLabel}</span>
            {" ocupada"}
          </>
        ) : (
          "Ocupada"
        )}
        {dateLabel ? (
          <>
            {" el "}
            <span className="font-semibold">{dateLabel}</span>
          </>
        ) : null}
        {" por "}
        {[
          occupant?.vessel_name || null,
          occupant?.shipping_line_name || null,
          statusLabel ? `estado ${statusLabel}` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        {occupant?.booking_code ? (
          <>
            {" · "}
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline underline-offset-2 hover:opacity-90"
              >
                {occupant.booking_code}
              </a>
            ) : (
              <span className="font-semibold">{occupant.booking_code}</span>
            )}
          </>
        ) : null}
        .
      </p>
    );
  }

  const text = message || positionOccupancyHintFromOccupant(occupant);
  if (!text) return null;
  return (
    <p
      className={[
        "mt-1.5 text-xs leading-snug text-amber-700 dark:text-amber-400",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {text}
    </p>
  );
}
