"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import ViewSection from "@/components/layout/ViewSection";
import CatalogLogoThumb from "@/components/ui/CatalogLogoThumb";
import { formatIsoDateLabel, toIsoDate } from "@/lib/bookingDates";
import { formatTimeShort } from "@/lib/bookingDisplay";
import { CalendarRange, CheckCircle2, Clock3, Ruler } from "lucide-react";
import { conflictCardClassName } from "@/lib/bookingConflictStyle";
import type { AvailabilityReport } from "@/services/bookings/bookingService";
import {
  bookingDetailHref,
  newBookingHref,
  type BookingBadgeStatus,
} from "@/types/booking";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import AvailabilityColorLegend from "./AvailabilityColorLegend";
import { availabilityCallMatchesStatus } from "./availabilityCallFilter";

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
  data: AvailabilityReport;
  /** Defaults to "Availability Chart". Use "Disponibilidad" in Reservas tab. */
  titlePrefix?: string;
  /** Status sidebar filters: highlight matches; neighbors stay visible (muted). */
  statusFilter?: string | string[];
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
    <div className="relative rounded-lg border border-dashed border-zinc-300 px-1 py-0.5 transition hover:border-[var(--admin-accent)] hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800/60">
      <span className="pointer-events-none block whitespace-nowrap text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {formatIsoDateLabel(draft, "short")}
      </span>
      <span className="pointer-events-none mt-0.5 block font-mono text-[10px] text-zinc-400">
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
  footer,
  scrollRootRef,
  canBook = false,
  returnTo = null,
  onStartDateChange,
}: Props) {
  const todayIso = todayIsoLocal();

  return (
    <ViewSection
      icon={CalendarRange}
      title={`${titlePrefix} — ${data.port_name}`}
      description={
        canBook
          ? "Clic en Disponible para reservar, o en una reserva para editarla."
          : "Matriz día × posición: libre, pasado u ocupada. Clic en una reserva para verla o editarla."
      }
    >
      <AvailabilityColorLegend />
      <div
        ref={scrollRootRef}
        className="max-h-[min(28rem,70vh)] overflow-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800"
      >
        <table
          className="w-full table-fixed border-separate border-spacing-0 text-left"
          style={{ minWidth: `${136 + data.columns.length * 208}px` }}
        >
          <colgroup>
            <col style={{ width: "136px" }} />
            {data.columns.map((column) => (
              <col key={column.id} style={{ width: "208px" }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-30">
            <tr>
              <th className="sticky left-0 z-40 border-b border-r border-zinc-200 bg-zinc-50 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950">
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
                  <td className="sticky left-0 z-20 border-b border-r border-zinc-200 bg-white px-3 py-3 align-top group-last:border-b-0 dark:border-zinc-800 dark:bg-zinc-900">
                    {isFirstEditable ? (
                      <AvailabilityStartDateCell
                        date={row.date}
                        onChange={(next) => onStartDateChange?.(next)}
                      />
                    ) : (
                      <>
                        <span className="block whitespace-nowrap text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {formatIsoDateLabel(row.date, "short")}
                        </span>
                        <span className="mt-0.5 block font-mono text-[10px] text-zinc-400">
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
                              calls.length === 1
                                ? `Ocupada por ${calls[0].vessel_name} (${calls[0].booking_code})`
                                : `Ocupada por componentes relacionados (${calls
                                    .map((c) => c.vessel_name)
                                    .join(", ")})`
                            }
                          />
                        ) : (
                          <div className="space-y-2">
                            {homeCalls.map((call) => {
                              const badgeStatus = asBadgeStatus(call.status);
                              const matchesFilter =
                                availabilityCallMatchesStatus(
                                  call,
                                  row.date,
                                  statusFilter,
                                  todayIso,
                                );
                              return (
                              <Link
                                key={call.booking_code}
                                href={bookingDetailHref(
                                  { booking_code: call.booking_code },
                                  { returnTo },
                                )}
                                className={[
                                  conflictCardClassName(
                                    call.has_conflict,
                                    "block rounded-lg border bg-white p-2.5 shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-accent)] dark:bg-zinc-900",
                                  ),
                                  matchesFilter
                                    ? "border-zinc-200 hover:border-[var(--admin-accent)]/40 hover:bg-[var(--admin-accent)]/5 dark:border-zinc-700 dark:hover:border-[var(--admin-accent)]/50"
                                    : "border-zinc-200/80 opacity-55 hover:opacity-80 dark:border-zinc-700/80",
                                ].join(" ")}
                                title={
                                  matchesFilter
                                    ? `Editar ${call.booking_code}${call.has_conflict ? " · Conflicto" : ""}`
                                    : `${call.booking_code} · otro estado (vecino)`
                                }
                                aria-label={`Abrir reserva ${call.booking_code}`}
                              >
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
                                        <BookingStatusBadge
                                          status={badgeStatus}
                                          size="sm"
                                        />
                                      ) : null}
                                    </div>
                                    <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                                      {call.shipping_line_name}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-2 space-y-1.5 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                                  <div className="flex items-center justify-between gap-3">
                                    {call.loa_m ? (
                                      <span className="inline-flex min-w-0 items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                        <Ruler
                                          className="h-3.5 w-3.5 shrink-0"
                                          aria-hidden
                                        />
                                        {Number(call.loa_m).toLocaleString(
                                          "es-MX",
                                        )}{" "}
                                        m
                                      </span>
                                    ) : (
                                      <span />
                                    )}
                                    <p className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                      <Clock3
                                        className="h-3.5 w-3.5 shrink-0"
                                        aria-hidden
                                      />
                                      {formatTimeShort(call.eta)}–
                                      {formatTimeShort(call.etd)}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                              );
                            })}
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
