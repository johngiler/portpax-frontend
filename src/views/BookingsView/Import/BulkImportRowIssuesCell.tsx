"use client";

import { useCallback, useRef, useState } from "react";
import { AlertTriangle, Check, Loader2, RefreshCw, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import NoticeAlert from "@/components/ui/NoticeAlert";
import type { BulkImportPreviewRow } from "@/services/bookings/bulkImportService";
import {
  BOOKING_STATUS_LABELS,
  bookingDetailHref,
  type BookingStatus,
} from "@/types/booking";
import { formatTimeShort } from "@/lib/bookingDisplay";
import { occupantDateLabel } from "@/lib/positionOccupancyHint";

type BulkImportRowIssuesCellProps = {
  row: BulkImportPreviewRow;
  revalidating?: boolean;
  onRefreshAvisos?: () => void | Promise<void>;
};

export default function BulkImportRowIssuesCell({
  row,
  revalidating = false,
  onRefreshAvisos,
}: BulkImportRowIssuesCellProps) {
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);

  const issues = row.issues ?? [];
  const occupant = row.position_occupant;
  const occupancyHint = row.position_occupancy_hint?.trim() || null;
  const hasOccupancy = Boolean(occupant || occupancyHint);
  const warnings = Array.from(new Set(row.warnings ?? []));
  const total = issues.length + warnings.length + (hasOccupancy ? 1 : 0);
  const ok = issues.length === 0;

  const refresh = useCallback(async () => {
    if (!onRefreshAvisos || refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    try {
      await onRefreshAvisos();
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }, [onRefreshAvisos]);

  if (revalidating && !open) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        Validando…
      </span>
    );
  }

  const statusLabel = occupant?.status
    ? BOOKING_STATUS_LABELS[occupant.status as BookingStatus] ||
      occupant.status.toUpperCase()
    : null;
  const bookingHref = occupant?.booking_code
    ? bookingDetailHref({ booking_code: occupant.booking_code })
    : null;
  const dateLabel = occupantDateLabel(occupant?.call_date || row.call_date);
  const busyRefresh = refreshing || revalidating;

  return (
    <>
      <div className="flex flex-col items-start gap-1">
        <span
          className={
            ok
              ? "inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"
              : "inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400"
          }
        >
          {ok ? (
            <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
          ) : (
            <X className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
          )}
          {ok ? "Sí" : "No"}
        </span>
        {total > 0 ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-amber-800 underline-offset-2 hover:bg-amber-50 hover:underline dark:text-amber-300 dark:hover:bg-amber-950/40"
          >
            <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
            Ver avisos ({total})
          </button>
        ) : null}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Avisos · fila ${row.row_number}`}
        panelClassName="max-w-lg"
        footer={
          <div className="flex flex-wrap items-center justify-end gap-3">
            {onRefreshAvisos ? (
              <button
                type="button"
                disabled={busyRefresh}
                onClick={() => void refresh()}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-200/80 bg-white px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${busyRefresh ? "animate-spin" : ""}`}
                  aria-hidden
                />
                {busyRefresh ? "Actualizando…" : "Actualizar"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded-md border border-zinc-200/80 bg-white px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cerrar
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {[row.vessel_name || row.ship, row.port_name || row.port_raw, row.call_date]
              .filter(Boolean)
              .join(" · ")}
            {onRefreshAvisos ? (
              <span className="mt-1 block text-[11px] text-zinc-400">
                Si editaste la reserva en otra pestaña, pulsa «Actualizar» para
                refrescar los avisos.
              </span>
            ) : null}
          </p>
          {busyRefresh ? (
            <p className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Actualizando avisos…
            </p>
          ) : null}
          {issues.length > 0 ? (
            <NoticeAlert variant="error" messages={issues} />
          ) : null}
          {warnings.length > 0 ? (
            <NoticeAlert variant="warning" messages={warnings} />
          ) : null}
          {hasOccupancy ? (
            <div
              className="flex gap-3 rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-300"
              role="status"
            >
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
                strokeWidth={2}
                aria-hidden
              />
              {occupant ? (
                <div className="min-w-0 flex-1 space-y-2 text-sm leading-snug">
                  <p>
                    {occupant.position_code || row.position_code ? (
                      <>
                        <span className="font-semibold">
                          {occupant.position_code || row.position_code}
                        </span>
                        {" ocupada"}
                      </>
                    ) : (
                      "Posición ocupada"
                    )}
                  </p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs sm:text-sm">
                    {dateLabel ? (
                      <>
                        <dt className="text-amber-700/70 dark:text-amber-400/70">
                          Fecha
                        </dt>
                        <dd className="font-semibold">{dateLabel}</dd>
                      </>
                    ) : null}
                    {occupant.eta || occupant.etd ? (
                      <>
                        <dt className="text-amber-700/70 dark:text-amber-400/70">
                          ETA / ETD
                        </dt>
                        <dd className="font-semibold tabular-nums">
                          {formatTimeShort(occupant.eta)}
                          {" – "}
                          {formatTimeShort(occupant.etd)}
                        </dd>
                      </>
                    ) : null}
                    {occupant.vessel_name ? (
                      <>
                        <dt className="text-amber-700/70 dark:text-amber-400/70">
                          Barco
                        </dt>
                        <dd>{occupant.vessel_name}</dd>
                      </>
                    ) : null}
                    {occupant.shipping_line_name ? (
                      <>
                        <dt className="text-amber-700/70 dark:text-amber-400/70">
                          Naviera
                        </dt>
                        <dd>{occupant.shipping_line_name}</dd>
                      </>
                    ) : null}
                    {statusLabel ? (
                      <>
                        <dt className="text-amber-700/70 dark:text-amber-400/70">
                          Estado
                        </dt>
                        <dd>{statusLabel}</dd>
                      </>
                    ) : null}
                    {occupant.booking_code ? (
                      <>
                        <dt className="text-amber-700/70 dark:text-amber-400/70">
                          Reserva
                        </dt>
                        <dd className="min-w-0 break-all">
                          {bookingHref ? (
                            <a
                              href={bookingHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold underline underline-offset-2 hover:opacity-90"
                            >
                              {occupant.booking_code}
                            </a>
                          ) : (
                            <span className="font-semibold">
                              {occupant.booking_code}
                            </span>
                          )}
                        </dd>
                      </>
                    ) : null}
                  </dl>
                </div>
              ) : (
                <p className="min-w-0 text-sm leading-snug">{occupancyHint}</p>
              )}
            </div>
          ) : !busyRefresh && issues.length === 0 && warnings.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Sin avisos para esta fila.
            </p>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
