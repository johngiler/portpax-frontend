"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useMainLayoutOptional } from "@/contexts/MainLayoutContext";
import ViewSection from "@/components/layout/ViewSection";
import { formatIsoDateLabel, toIsoDate } from "@/lib/bookingDates";
import { CalendarRange, CheckCircle2, Ruler } from "lucide-react";
import type { AvailabilityReport } from "@/services/bookings/bookingService";
import {
  newBookingHref,
  type CancellationReason,
} from "@/types/booking";
import type { ConflictTypeFilterValue } from "@/lib/bookingConflictLabels";
import AvailabilityColorLegend from "./AvailabilityColorLegend";
import AvailabilityOccupiedCallCard from "./AvailabilityOccupiedCallCard";
import {
  availabilityCallMatchesFocus,
  occupiedCallHidesCarrierIdentity,
} from "./availabilityCallFilter";

type Props = {
  data: AvailabilityReport;
  /** Defaults to "Availability Chart". Use "Disponibilidad" in Reservas tab. */
  titlePrefix?: string;
  /** Status sidebar filters: highlight matches; neighbors stay visible (muted). */
  statusFilter?: string | string[];
  /** Vessel sidebar focus: highlight matches; other ships stay muted. */
  vesselFocusId?: number;
  /** Shipping-line focus when no vessel is selected. */
  shippingLineFocusId?: number;
  shippingLineFocusIds?: number[];
  /** Group focus when no line/vessel is selected. */
  shippingLineGroupFocusId?: number;
  shippingLineGroupFocusIds?: number[];
  /** Position focus: other berths stay visible (muted). */
  positionFocusId?: number;
  /** Tag soft-focus (any of the IDs). */
  tagFocusIds?: number[];
  /** Conflict sidebar focus (neighbors stay muted). */
  conflictFocus?: {
    has_conflict?: boolean;
    conflict_severity?: "yellow" | "red" | "green";
    conflict_type?: ConflictTypeFilterValue;
    first_arrival?: boolean;
    cancellation_reason?: CancellationReason | "";
  };
  /** Inside the card scroll panel (e.g. load-more sentinel). */
  footer?: ReactNode;
  /** Ref for the card's overflow container (infinite scroll root). */
  scrollRootRef?: RefObject<HTMLDivElement | null>;
  /** When true, empty future pier cells open the booking wizard. */
  canBook?: boolean;
  returnTo?: string | null;
  /**
   * When set, the first date row is editable; changing it shifts the grid
   * start (Fernanda: consecutive days from the new first date).
   */
  onStartDateChange?: (isoDate: string) => void;
};

function todayIsoLocal(): string {
  const d = new Date();
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

function AvailabilityStartDateCell({
  date,
  onChange,
}: {
  date: string;
  onChange: (isoDate: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Local draft so year/month navigation does not commit (and remount) early.
  const [draft, setDraft] = useState(date);
  const dateRef = useRef(date);
  dateRef.current = date;

  useEffect(() => {
    setDraft(date);
  }, [date]);

  function openDayPicker() {
    const input = inputRef.current;
    if (!input) return;
    try {
      if (typeof input.showPicker === "function") {
        void input.showPicker();
      }
    } catch {
      // Native click still opens the day calendar when the input has size.
    }
  }

  function commitIfChanged(next: string) {
    if (!next || next === dateRef.current) return;
    onChange(next);
  }

  function handleDraftChange(next: string) {
    if (!next) return;
    setDraft(next);
    // Day click: commit now (blur often does not fire after native picker).
    if (next.slice(8, 10) !== dateRef.current.slice(8, 10)) {
      commitIfChanged(next);
      return;
    }
    // Same day number (year/month spin): commit only after picker closes.
    queueMicrotask(() => {
      requestAnimationFrame(() => {
        if (document.activeElement !== inputRef.current) {
          commitIfChanged(next);
        }
      });
    });
  }

  return (
    <div className="relative min-w-0 rounded-lg border border-dashed border-zinc-300 px-1.5 py-1 transition hover:border-[var(--admin-accent)] hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800/60">
      <span className="pointer-events-none block text-xs font-semibold leading-snug text-zinc-900 sm:text-sm dark:text-zinc-50">
        {formatIsoDateLabel(draft, "short")}
      </span>
      <span className="pointer-events-none mt-0.5 hidden font-mono text-[10px] text-zinc-400 sm:block">
        {draft}
      </span>
      <input
        ref={inputRef}
        type="date"
        value={draft}
        onClick={openDayPicker}
        onChange={(e) => handleDraftChange(e.target.value)}
        onBlur={(e) => commitIfChanged(e.currentTarget.value)}
        className="absolute inset-0 z-10 cursor-pointer opacity-0"
        title="Cambiar fecha de inicio"
        aria-label="Cambiar fecha de inicio del rango"
      />
    </div>
  );
}

const availableSlotClass =
  "flex min-h-16 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-emerald-200 bg-emerald-50/60 text-xs font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300";

function AvailableSlot({
  bookable,
  href,
  label,
}: {
  bookable: boolean;
  href: string;
  label: string;
}) {
  if (bookable) {
    return (
      <Link
        href={href}
        className={`${availableSlotClass} transition hover:border-emerald-400 hover:bg-emerald-100/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40`}
        title={`Reservar · ${label}`}
        aria-label={`Reservar en ${label}`}
      >
        <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        Disponible
      </Link>
    );
  }

  return (
    <div className={availableSlotClass}>
      <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      Disponible
    </div>
  );
}

function UnavailableSlot({ reason }: { reason?: string }) {
  return (
    <div
      className="flex min-h-16 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-100/90 text-xs font-medium text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900/70 dark:text-zinc-400"
      title={reason}
    >
      No disponible
    </div>
  );
}

export default function AvailabilityChartSection({
  data,
  titlePrefix = "Availability Chart",
  statusFilter,
  vesselFocusId = 0,
  shippingLineFocusId = 0,
  shippingLineFocusIds,
  shippingLineGroupFocusId = 0,
  shippingLineGroupFocusIds,
  positionFocusId = 0,
  tagFocusIds,
  conflictFocus,
  footer,
  scrollRootRef,
  canBook = false,
  returnTo = null,
  onStartDateChange,
}: Props) {
  const todayIso = todayIsoLocal();
  const isMobile = useMainLayoutOptional()?.isMobile ?? false;
  // Wide enough for «Lun 19 oct 2026» (nowrap off + wrap on narrow).
  const dateColPx = isMobile ? 124 : 156;
  const dayColPx = isMobile ? 168 : 208;
  /** Hide names as «Posición asignada»; focused naviera/grupo/barco stay visible. */
  const [hideCarrierIdentity, setHideCarrierIdentity] = useState(false);
  const focus = {
    statuses: statusFilter,
    vesselId: vesselFocusId,
    shippingLineIds:
      shippingLineFocusIds && shippingLineFocusIds.length > 0
        ? shippingLineFocusIds
        : shippingLineFocusId > 0
          ? [shippingLineFocusId]
          : undefined,
    shippingLineGroupIds:
      shippingLineGroupFocusIds && shippingLineGroupFocusIds.length > 0
        ? shippingLineGroupFocusIds
        : shippingLineGroupFocusId > 0
          ? [shippingLineGroupFocusId]
          : undefined,
    positionId: positionFocusId,
    tagIds: tagFocusIds?.length ? tagFocusIds : undefined,
    has_conflict: conflictFocus?.has_conflict,
    conflict_severity: conflictFocus?.conflict_severity,
    conflict_type: conflictFocus?.conflict_type,
    first_arrival: conflictFocus?.first_arrival,
    cancellation_reason: conflictFocus?.cancellation_reason,
  };

  return (
    <ViewSection
      icon={CalendarRange}
      title={`${titlePrefix} — ${data.port_name}`}
      description={
        canBook
          ? "Clic en Disponible para reservar, o en una reserva para editarla."
          : "Matriz día × posición: libre, pasado u ocupada. Clic en una reserva para verla o editarla."
      }
      actions={
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={hideCarrierIdentity}
            onChange={(e) => setHideCarrierIdentity(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-zinc-300 text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
          />
          Navieras
        </label>
      }
    >
      <AvailabilityColorLegend />
      <div
        ref={scrollRootRef}
        className="max-h-[min(42rem,85vh)] overflow-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800"
      >
        <table
          className="w-full table-fixed border-separate border-spacing-0 text-left"
          style={{
            minWidth: `${dateColPx + data.columns.length * dayColPx}px`,
          }}
        >
          <colgroup>
            <col style={{ width: `${dateColPx}px` }} />
            {data.columns.map((column) => (
              <col key={column.id} style={{ width: `${dayColPx}px` }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-30">
            <tr>
              <th className="sticky left-0 z-40 border-b border-r border-zinc-200 bg-zinc-50 px-2 py-2.5 sm:px-3 sm:py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Fecha
                </span>
              </th>
              {data.columns.map((column) => (
                <th
                  key={column.id}
                  className="border-b border-r border-zinc-200 bg-zinc-50 px-2 py-2.5 last:border-r-0 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="rounded-lg border border-zinc-200 bg-white px-2.5 py-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {column.label}
                      </span>
                      {column.max_loa_m ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                          <Ruler className="h-3 w-3" aria-hidden />
                          {Number(column.max_loa_m).toLocaleString("es-MX")} m
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs font-normal text-zinc-500 dark:text-zinc-400">
                      {column.berth_name || "Área de fondeo"}
                    </p>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => {
              const isFirstEditable =
                rowIndex === 0 && Boolean(onStartDateChange);
              return (
                <tr key={row.date} className="group">
                  <td className="sticky left-0 z-20 min-w-0 border-b border-r border-zinc-200 bg-white px-1.5 py-2 align-top group-last:border-b-0 sm:px-3 sm:py-3 dark:border-zinc-800 dark:bg-zinc-900">
                    {isFirstEditable ? (
                      <AvailabilityStartDateCell
                        date={row.date}
                        onChange={(next) => onStartDateChange?.(next)}
                      />
                    ) : (
                      <>
                        <span className="block text-xs font-semibold leading-snug text-zinc-900 sm:text-sm dark:text-zinc-50">
                          {formatIsoDateLabel(row.date, "short")}
                        </span>
                        <span className="mt-0.5 hidden font-mono text-[10px] text-zinc-400 sm:block">
                          {row.date}
                        </span>
                      </>
                    )}
                  </td>
                  {data.columns.map((column, idx) => {
                    const calls = row.cells[idx] ?? [];
                    const isRealPosition = column.id > 0;
                    const homeCalls = calls.filter(
                      (call) =>
                        call.position_id == null ||
                        call.position_id === 0 ||
                        call.position_id === column.id,
                    );
                    const relatedOnly =
                      calls.length > 0 && homeCalls.length === 0;
                    return (
                      <td
                        key={`${row.date}-${column.id}`}
                        className="border-b border-r border-zinc-200 bg-zinc-50/40 p-2 align-top last:border-r-0 group-last:border-b-0 dark:border-zinc-800 dark:bg-zinc-950/30"
                      >
                        {calls.length === 0 ? (
                          row.date < todayIso ? (
                            <div className="flex min-h-16 items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-100/80 text-xs font-medium text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-500">
                              Pasado
                            </div>
                          ) : (
                            <AvailableSlot
                              bookable={canBook && isRealPosition}
                              href={newBookingHref({
                                portId: data.port_id,
                                callDate: row.date,
                                positionId: column.id,
                                positionLabel: column.label,
                                returnTo,
                              })}
                              label={`${column.label} · ${row.date}`}
                            />
                          )
                        ) : relatedOnly ? (
                          <UnavailableSlot
                            reason={
                              calls.every((call) =>
                                occupiedCallHidesCarrierIdentity(
                                  hideCarrierIdentity,
                                  call,
                                  focus,
                                ),
                              )
                                ? "Posición ocupada"
                                : calls.length === 1
                                  ? `Ocupada por ${calls[0].vessel_name} (${calls[0].booking_code})`
                                  : `Ocupada por componentes relacionados (${calls
                                      .map((c) => c.vessel_name)
                                      .join(", ")})`
                            }
                          />
                        ) : (
                          <div className="space-y-2">
                            {homeCalls.map((call) => (
                              <AvailabilityOccupiedCallCard
                                key={call.booking_code}
                                call={call}
                                hideCarrierIdentity={occupiedCallHidesCarrierIdentity(
                                  hideCarrierIdentity,
                                  call,
                                  focus,
                                )}
                                matchesFilter={availabilityCallMatchesFocus(
                                  call,
                                  row.date,
                                  focus,
                                  todayIso,
                                )}
                                returnTo={returnTo}
                                rowDate={row.date}
                                todayIso={todayIso}
                                focus={focus}
                              />
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {footer ? (
          <div className="border-t border-zinc-200 px-2 py-2 dark:border-zinc-800">
            {footer}
          </div>
        ) : null}
      </div>
    </ViewSection>
  );
}
