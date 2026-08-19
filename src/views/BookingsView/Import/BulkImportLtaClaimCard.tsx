"use client";

import { Anchor, Check } from "lucide-react";
import {
  BOOKING_DETAIL_LINK_PROPS,
  bookingDetailHref,
  BOOKING_STATUS_LABELS,
  type BookingStatus,
} from "@/types/booking";
import type { BulkImportLtaCandidate } from "@/services/bookings/bulkImportService";
import { occupantDateLabel } from "@/lib/positionOccupancyHint";

type BulkImportLtaClaimCardProps = {
  candidate: BulkImportLtaCandidate;
  callDate?: string | null;
  claimed?: boolean;
  disabled?: boolean;
  onClaim?: () => void;
};

export function isLtaClaimIssueMessage(message: string): boolean {
  return (
    message.includes("Reclamar espacio LTA") ||
    /espacio LTA de /i.test(message) ||
    /Hay un espacio LTA/i.test(message)
  );
}

export default function BulkImportLtaClaimCard({
  candidate,
  callDate = null,
  claimed = false,
  disabled = false,
  onClaim,
}: BulkImportLtaClaimCardProps) {
  const href = candidate.booking_code
    ? bookingDetailHref({ booking_code: candidate.booking_code })
    : null;
  const dateLabel = occupantDateLabel(callDate);
  const statusLabel = candidate.status
    ? BOOKING_STATUS_LABELS[candidate.status as BookingStatus] ||
      candidate.status.toUpperCase()
    : "LTA";

  if (claimed) {
    return (
      <div
        className="flex gap-3 rounded-xl border border-emerald-200/90 bg-emerald-50 px-4 py-3 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-300"
        role="status"
      >
        <Check
          className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
          strokeWidth={2.5}
          aria-hidden
        />
        <div className="min-w-0 space-y-1 text-sm leading-snug">
          <p className="font-semibold">Espacio LTA marcado para reclamar</p>
          <p className="text-xs text-emerald-800/80 dark:text-emerald-400/80">
            Al importar se actualizará a Confirmada LTA
            {candidate.position_code
              ? ` · posición ${candidate.position_code}`
              : ""}
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex gap-3 rounded-xl border border-sky-200/90 bg-sky-50 px-4 py-3 text-sky-950 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200"
      role="status"
    >
      <Anchor
        className="mt-0.5 h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400"
        strokeWidth={2}
        aria-hidden
      />
      <div className="min-w-0 flex-1 space-y-2.5 text-sm leading-snug">
        <div>
          <p className="font-semibold">Espacio LTA reservado para ti</p>
          <p className="mt-0.5 text-xs text-sky-800/80 dark:text-sky-400/80">
            Cupo apartado de la naviera en esta fecha.
          </p>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs sm:text-sm">
          {candidate.shipping_line_name ? (
            <>
              <dt className="text-sky-700/70 dark:text-sky-400/70">Naviera</dt>
              <dd className="font-medium">{candidate.shipping_line_name}</dd>
            </>
          ) : null}
          {candidate.position_code ? (
            <>
              <dt className="text-sky-700/70 dark:text-sky-400/70">Posición</dt>
              <dd className="font-semibold">{candidate.position_code}</dd>
            </>
          ) : null}
          {dateLabel ? (
            <>
              <dt className="text-sky-700/70 dark:text-sky-400/70">Fecha</dt>
              <dd className="font-semibold">{dateLabel}</dd>
            </>
          ) : null}
          {candidate.vessel_name ? (
            <>
              <dt className="text-sky-700/70 dark:text-sky-400/70">
                Barco LTA
              </dt>
              <dd>
                {candidate.vessel_name}
                {candidate.vessel_is_provisional ? (
                  <span className="text-sky-700/60 dark:text-sky-400/60">
                    {" "}
                    (provisional)
                  </span>
                ) : null}
              </dd>
            </>
          ) : null}
          <>
            <dt className="text-sky-700/70 dark:text-sky-400/70">Estado</dt>
            <dd>{statusLabel}</dd>
          </>
          {candidate.booking_code ? (
            <>
              <dt className="text-sky-700/70 dark:text-sky-400/70">Reserva</dt>
              <dd className="min-w-0 break-all">
                {href ? (
                  <a
                    href={href}
                    {...BOOKING_DETAIL_LINK_PROPS}
                    className="font-semibold underline underline-offset-2 hover:opacity-90"
                  >
                    {candidate.booking_code}
                  </a>
                ) : (
                  <span className="font-semibold">{candidate.booking_code}</span>
                )}
              </dd>
            </>
          ) : null}
        </dl>

        {onClaim ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onClaim}
            className="inline-flex cursor-pointer items-center justify-center rounded-md bg-sky-700 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-sky-600 dark:hover:bg-sky-500"
          >
            Reclamar espacio LTA
          </button>
        ) : (
          <p className="text-xs text-sky-800/80 dark:text-sky-400/80">
            Marca la columna «Reclamar espacio LTA» en la tabla.
          </p>
        )}
      </div>
    </div>
  );
}
