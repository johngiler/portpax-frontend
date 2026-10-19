"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, MapPin } from "lucide-react";
import BookingMetaRow from "@/components/booking/BookingMetaRow";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import FirstArrivalBadge from "@/components/booking/FirstArrivalBadge";
import ConflictTypeChips from "@/components/booking/ConflictTypeChips";
import {
  conflictCallCardFrameSeverity,
  conflictChipTitle,
  conflictChipsFromApi,
  conflictHighlightsFromApi,
  conflictListFrameSeverity,
} from "@/lib/conflictDisplayFromApi";
import {
  conflictCardClassName,
  conflictFieldHighlightClassName,
} from "@/lib/bookingConflictStyle";
import { useConfirm } from "@/contexts/ConfirmContext";
import { currentReturnTo } from "@/lib/safeReturnTo";
import { formatIsoWeekdayShort, parseIsoDate } from "@/lib/bookingDates";
import { shippingLineWithGroupLabel } from "@/components/ui/ShippingLineCaption";
import {
  BOOKING_DETAIL_LINK_PROPS,
  bookingDetailHref,
  bookingStatusLabel,
  canBulkDeleteBookings,
  commonBulkNextStatuses,
  getBookingBadgeStatus,
  isBookingMassEditable,
  type BookingListItem,
  type BookingStatus,
  type BookingUpdatePayload,
} from "@/types/booking";
import BookingsBulkBar from "./BookingsBulkBar";
import BookingsBulkCancelModal, {
  type BulkCancelConfirmPayload,
} from "./BookingsBulkCancelModal";
import BookingsEmptyState from "./BookingsEmptyState";

export type BulkStatusPayload = Pick<
  BookingUpdatePayload,
  "status" | "cancellation_reason" | "tag_name"
>;

type BookingsListProps = {
  bookings: BookingListItem[];
  /** API total for the current filter set (may be > loaded rows). */
  totalCount?: number;
  hasActiveFilters?: boolean;
  /** Changes when list filters change — clears selection. */
  selectionResetKey?: string;
  onClearFilters?: () => void;
  /** Load every page matching filters into the list (for select-all). */
  onLoadAllMatching?: () => Promise<BookingListItem[]>;
  canWrite?: boolean;
  onBulkDelete?: (ids: number[]) => Promise<void>;
  onBulkStatus?: (ids: number[], payload: BulkStatusPayload) => Promise<void>;
  onMassEdit?: (ids: number[]) => void;
};

function DateBadge({ callDate }: { callDate: string }) {
  const { day, monthIndex, year } = parseIsoDate(callDate);
  const month = new Date(2000, monthIndex, 1).toLocaleDateString("es-MX", {
    month: "short",
  });
  const weekday = formatIsoWeekdayShort(callDate);
  const monthShort = month.replace(/\.$/, "");

  return (
    <div className="flex h-[4.75rem] w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--admin-accent)]/10 px-1.5 py-1.5 text-[var(--admin-accent)] sm:h-[4.25rem] sm:w-12 sm:px-1 sm:py-0">
      <span className="text-[10px] font-semibold uppercase tracking-wide leading-none sm:text-[10px]">
        {weekday}
      </span>
      <span className="mt-1 text-2xl font-bold leading-none tabular-nums sm:mt-0.5 sm:text-lg">
        {day}
      </span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide leading-none sm:mt-0.5 sm:text-[10px]">
        {monthShort}
      </span>
      <span className="mt-0.5 hidden text-[10px] font-semibold tabular-nums leading-none sm:block">
        {year}
      </span>
    </div>
  );
}

function CodeActions({
  booking,
  detailHref,
}: {
  booking: BookingListItem;
  detailHref: string;
}) {
  return (
    <Link
      href={detailHref}
      {...BOOKING_DETAIL_LINK_PROPS}
      className="flex w-full max-w-full items-center gap-2 rounded-lg px-0.5 py-0.5 text-zinc-400 transition-colors hover:text-[var(--admin-accent)] sm:justify-end sm:rounded-none sm:px-0 sm:py-0"
      aria-label={`Abrir reserva ${booking.booking_code}`}
    >
      <code
        className="min-w-0 flex-1 truncate text-[10px] font-medium tracking-wide sm:max-w-[14rem] sm:flex-none sm:rounded-md sm:bg-zinc-50 sm:px-2 sm:py-1 sm:font-semibold sm:text-zinc-500 lg:max-w-[18rem] dark:sm:bg-zinc-950/60 dark:sm:text-zinc-400"
        title={booking.booking_code}
      >
        {booking.booking_code}
      </code>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--admin-accent)]"
        strokeWidth={2}
        aria-hidden
      />
    </Link>
  );
}

export default function BookingsList({
  bookings,
  totalCount = 0,
  hasActiveFilters = false,
  selectionResetKey = "",
  onClearFilters,
  onLoadAllMatching,
  canWrite = false,
  onBulkDelete,
  onBulkStatus,
  onMassEdit,
}: BookingsListProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = currentReturnTo(pathname, searchParams);
  const { requestConfirm } = useConfirm();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const bookingById = useMemo(() => {
    const map = new Map<number, BookingListItem>();
    for (const b of bookings) map.set(b.id, b);
    return map;
  }, [bookings]);

  const visibleIds = useMemo(() => bookings.map((b) => b.id), [bookings]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [selectionResetKey]);

  const selectedBookings = useMemo(
    () =>
      [...selectedIds]
        .map((id) => bookingById.get(id))
        .filter((b): b is BookingListItem => Boolean(b)),
    [selectedIds, bookingById],
  );

  const commonNext = useMemo(
    () => commonBulkNextStatuses(selectedBookings),
    [selectedBookings],
  );
  const canDelete = canBulkDeleteBookings(selectedBookings);
  const noSharedActions =
    selectedBookings.length > 0 && commonNext.length === 0 && !canDelete;

  if (bookings.length === 0) {
    return (
      <BookingsEmptyState
        variant={hasActiveFilters ? "filtered" : "empty"}
        onClearFilters={onClearFilters}
      />
    );
  }

  const selectedCount = selectedIds.size;
  const matchingTotal = Math.max(totalCount, visibleIds.length);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const allMatchingSelected =
    matchingTotal > 0 &&
    selectedCount >= matchingTotal &&
    visibleIds.length >= matchingTotal &&
    visibleIds.every((id) => selectedIds.has(id));
  const selectionEnabled = Boolean(
    canWrite && (onBulkDelete || onBulkStatus || onMassEdit),
  );
  const showSelectAllMatching =
    hasActiveFilters && matchingTotal > 0 && Boolean(onLoadAllMatching);
  const massEditableSelected = selectedBookings.filter((booking) =>
    isBookingMassEditable(booking.status),
  );
  const canMassEdit =
    Boolean(onMassEdit) && massEditableSelected.length > 0;

  function toggleOne(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSelectVisible() {
    setSelectedIds((prev) => {
      if (allVisibleSelected) return new Set();
      return new Set([...prev, ...visibleIds]);
    });
  }

  async function toggleSelectAllMatching() {
    if (!onLoadAllMatching) return;
    if (allMatchingSelected) {
      setSelectedIds(new Set());
      return;
    }
    setBusy(true);
    try {
      const all = await onLoadAllMatching();
      setSelectedIds(new Set(all.map((booking) => booking.id)));
    } finally {
      setBusy(false);
    }
  }

  async function runBulk(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      setSelectedIds(new Set());
      setCancelOpen(false);
    } finally {
      setBusy(false);
    }
  }

  function handleStatusAction(status: BookingStatus) {
    if (!onBulkStatus || selectedIds.size === 0) return;
    if (status === "c") {
      setCancelOpen(true);
      return;
    }
    const label = bookingStatusLabel(status);
    const count = selectedIds.size;
    requestConfirm({
      title: "Cambio de estado masivo",
      message: `¿Pasar ${count} reserva${count === 1 ? "" : "s"} a «${label}»? Solo se aplicará si la transición es válida en cada una.`,
      confirmLabel: "Aplicar",
      danger: false,
      onConfirm: () => {
        void runBulk(() =>
          onBulkStatus([...selectedIds], { status }),
        );
      },
    });
  }

  function handleConfirmCancel(payload: BulkCancelConfirmPayload) {
    if (!onBulkStatus || selectedIds.size === 0) return;
    void runBulk(() =>
      onBulkStatus([...selectedIds], {
        status: "c",
        cancellation_reason: payload.reason,
        ...(payload.tagName ? { tag_name: payload.tagName } : {}),
      }),
    );
  }

  return (
    <div>
      {selectionEnabled ? (
        <BookingsBulkBar
          selectedCount={selectedCount}
          visibleCount={visibleIds.length}
          totalCount={matchingTotal}
          showSelectAllMatching={showSelectAllMatching}
          allVisibleSelected={allVisibleSelected}
          allMatchingSelected={allMatchingSelected}
          busy={busy}
          commonNextStatuses={commonNext}
          canDelete={canDelete}
          noSharedActions={noSharedActions}
          canMassEdit={canMassEdit}
          onToggleSelectVisible={toggleSelectVisible}
          onToggleSelectAllMatching={
            showSelectAllMatching ? () => void toggleSelectAllMatching() : undefined
          }
          onClear={() => setSelectedIds(new Set())}
          onDelete={() => {
            if (!onBulkDelete || selectedIds.size === 0) return;
            void runBulk(() => onBulkDelete([...selectedIds]));
          }}
          onStatusAction={handleStatusAction}
          onMassEdit={
            canMassEdit && onMassEdit
              ? () => onMassEdit(massEditableSelected.map((booking) => booking.id))
              : undefined
          }
        />
      ) : null}

      <BookingsBulkCancelModal
        open={cancelOpen}
        count={selectedCount}
        saving={busy}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleConfirmCancel}
      />

      <ul className="space-y-3 sm:space-y-3">
        {bookings.map((booking) => {
          const positionLabel = booking.position_code || "Sin asignar";
          const detailHref = bookingDetailHref(booking, { returnTo });
          const checked = selectedIds.has(booking.id);
          const highlights = conflictHighlightsFromApi(booking);
          const chips = conflictChipsFromApi(booking);
          const listFrameSeverity = conflictListFrameSeverity(highlights);
          const lineLabel = shippingLineWithGroupLabel(
            booking.shipping_line_name,
            booking.shipping_line_group_name,
          );

          return (
            <li key={booking.id}>
              <article
                className={conflictCardClassName(
                  listFrameSeverity,
                  "group relative flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-[var(--admin-card-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--admin-accent)]/30 hover:shadow-lg sm:flex-row sm:items-start sm:gap-4 sm:rounded-2xl sm:px-4 sm:py-3 dark:border-zinc-800 dark:bg-zinc-900/80",
                )}
              >
                <div className="flex min-w-0 flex-1 items-start gap-3 pr-8 sm:items-center sm:gap-4 sm:pr-0">
                  {selectionEnabled ? (
                    <div className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center sm:static sm:h-14 sm:w-5 sm:shrink-0">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-zinc-300 text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
                        checked={checked}
                        disabled={busy}
                        onChange={(e) =>
                          toggleOne(booking.id, e.target.checked)
                        }
                        aria-label={`Seleccionar ${booking.booking_code}`}
                      />
                    </div>
                  ) : null}

                  <Link
                    href={detailHref}
                    {...BOOKING_DETAIL_LINK_PROPS}
                    className="shrink-0 cursor-pointer"
                  >
                    <DateBadge callDate={booking.call_date} />
                  </Link>

                  <div className="min-w-0 flex-1">
                    {/* Mobile: name full width, then status row */}
                    <div className="flex flex-col gap-1.5 sm:hidden">
                      <Link
                        href={detailHref}
                        {...BOOKING_DETAIL_LINK_PROPS}
                        className="truncate pr-1 text-base font-semibold leading-snug text-zinc-900 hover:text-[var(--admin-accent)] dark:text-zinc-50"
                      >
                        {booking.vessel_name}
                      </Link>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <BookingStatusBadge
                          status={getBookingBadgeStatus(booking)}
                          size="sm"
                        />
                        {booking.first_arrival ? <FirstArrivalBadge /> : null}
                        <ConflictTypeChips chips={chips} />
                      </div>
                      <Link
                        href={detailHref}
                        {...BOOKING_DETAIL_LINK_PROPS}
                        className="flex min-w-0 flex-col gap-0.5 text-xs leading-snug text-zinc-600 dark:text-zinc-300"
                      >
                        <span className="flex min-w-0 items-center gap-1">
                          <MapPin
                            className="h-3.5 w-3.5 shrink-0 text-zinc-400"
                            aria-hidden
                          />
                          <span className="truncate font-medium text-zinc-700 dark:text-zinc-200">
                            {booking.port_name}
                          </span>
                        </span>
                        <span className="truncate pl-5 text-zinc-500">
                          {lineLabel}
                        </span>
                      </Link>
                    </div>

                    {/* Desktop: original compact header */}
                    <div className="hidden space-y-1 sm:block">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Link
                          href={detailHref}
                          {...BOOKING_DETAIL_LINK_PROPS}
                          className="min-w-0 truncate text-sm font-semibold text-zinc-900 hover:text-[var(--admin-accent)] dark:text-zinc-50"
                        >
                          {booking.vessel_name}
                        </Link>
                        <BookingStatusBadge
                          status={getBookingBadgeStatus(booking)}
                        />
                        {booking.first_arrival ? <FirstArrivalBadge /> : null}
                        <ConflictTypeChips chips={chips} />
                      </div>
                      <Link
                        href={detailHref}
                        {...BOOKING_DETAIL_LINK_PROPS}
                        className="flex min-w-0 cursor-pointer items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-300"
                      >
                        <MapPin
                          className="h-3.5 w-3.5 shrink-0 text-zinc-400"
                          aria-hidden
                        />
                        <span className="truncate">
                          {booking.port_name}
                          <span className="text-zinc-400"> · </span>
                          {lineLabel}
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:max-w-[min(100%,28rem)] sm:shrink-0 sm:items-end">
                  <BookingMetaRow
                    layout="grid"
                    className="sm:justify-end"
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
                  <CodeActions booking={booking} detailHref={detailHref} />
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
