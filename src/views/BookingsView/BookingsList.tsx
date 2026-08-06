"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, MapPin } from "lucide-react";
import BookingMetaRow from "@/components/booking/BookingMetaRow";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import ConfirmationPdfButton from "@/components/booking/ConfirmationPdfButton";
import { useConfirm } from "@/contexts/ConfirmContext";
import { currentReturnTo } from "@/lib/safeReturnTo";
import { parseIsoDate } from "@/lib/bookingDates";
import {
  bookingDetailHref,
  bookingStatusLabel,
  canBulkDeleteBookings,
  commonBulkNextStatuses,
  getBookingBadgeStatus,
  type Booking,
  type BookingStatus,
  type BookingUpdatePayload,
  type CancellationReason,
} from "@/types/booking";
import BookingsBulkBar from "./BookingsBulkBar";
import BookingsBulkCancelModal from "./BookingsBulkCancelModal";
import BookingsEmptyState from "./BookingsEmptyState";

export type BulkStatusPayload = Pick<
  BookingUpdatePayload,
  "status" | "cancellation_reason"
>;

type BookingsListProps = {
  bookings: Booking[];
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  canWrite?: boolean;
  onBulkDelete?: (ids: number[]) => Promise<void>;
  onBulkStatus?: (ids: number[], payload: BulkStatusPayload) => Promise<void>;
};

function DateBadge({ callDate }: { callDate: string }) {
  const { day, monthIndex, year } = parseIsoDate(callDate);
  const month = new Date(2000, monthIndex, 1).toLocaleDateString("es-MX", {
    month: "short",
  });

  return (
    <div className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
      <span className="text-lg font-bold leading-none">{day}</span>
      <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide leading-none">
        {month.replace(/\.$/, "")}
      </span>
      <span className="mt-0.5 text-[10px] font-semibold tabular-nums leading-none">
        {year}
      </span>
    </div>
  );
}

function CodeActions({
  booking,
  detailHref,
}: {
  booking: Booking;
  detailHref: string;
}) {
  return (
    <div className="flex w-full max-w-full items-center justify-end gap-2">
      <code
        className="min-w-0 max-w-[14rem] truncate rounded-md bg-zinc-50 px-2 py-1 text-[10px] font-semibold tracking-wide text-zinc-500 dark:bg-zinc-950/60 dark:text-zinc-400 lg:max-w-[18rem]"
        title={booking.booking_code}
      >
        {booking.booking_code}
      </code>
      <Link
        href={detailHref}
        className="inline-flex shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--admin-accent)]"
        aria-label={`Abrir reserva ${booking.booking_code}`}
      >
        <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
      </Link>
    </div>
  );
}

export default function BookingsList({
  bookings,
  hasActiveFilters = false,
  onClearFilters,
  canWrite = false,
  onBulkDelete,
  onBulkStatus,
}: BookingsListProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = currentReturnTo(pathname, searchParams);
  const { requestConfirm } = useConfirm();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const bookingById = useMemo(() => {
    const map = new Map<number, Booking>();
    for (const b of bookings) map.set(b.id, b);
    return map;
  }, [bookings]);

  const visibleIds = useMemo(() => bookings.map((b) => b.id), [bookings]);
  const visibleIdSet = useMemo(() => new Set(visibleIds), [visibleIds]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set<number>();
      for (const id of prev) {
        if (visibleIdSet.has(id)) next.add(id);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [visibleIdSet]);

  const selectedBookings = useMemo(
    () =>
      [...selectedIds]
        .map((id) => bookingById.get(id))
        .filter((b): b is Booking => Boolean(b)),
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
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const selectionEnabled = Boolean(canWrite && (onBulkDelete || onBulkStatus));

  function toggleOne(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      if (allVisibleSelected) return new Set();
      return new Set([...prev, ...visibleIds]);
    });
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

  function handleConfirmCancel(reason: CancellationReason) {
    if (!onBulkStatus || selectedIds.size === 0) return;
    void runBulk(() =>
      onBulkStatus([...selectedIds], {
        status: "c",
        cancellation_reason: reason,
      }),
    );
  }

  return (
    <div>
      {selectionEnabled ? (
        <BookingsBulkBar
          selectedCount={selectedCount}
          visibleCount={visibleIds.length}
          allVisibleSelected={allVisibleSelected}
          busy={busy}
          commonNextStatuses={commonNext}
          canDelete={canDelete}
          noSharedActions={noSharedActions}
          onToggleSelectAll={toggleSelectAll}
          onClear={() => setSelectedIds(new Set())}
          onDelete={() => {
            if (!onBulkDelete || selectedIds.size === 0) return;
            void runBulk(() => onBulkDelete([...selectedIds]));
          }}
          onStatusAction={handleStatusAction}
        />
      ) : null}

      <BookingsBulkCancelModal
        open={cancelOpen}
        count={selectedCount}
        saving={busy}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleConfirmCancel}
      />

      <ul className="space-y-3">
        {bookings.map((booking) => {
          const positionLabel = booking.position_code || "Sin asignar";
          const detailHref = bookingDetailHref(booking, { returnTo });
          const checked = selectedIds.has(booking.id);

          return (
            <li key={booking.id}>
              <article className="group flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 shadow-[var(--admin-card-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--admin-accent)]/30 hover:shadow-lg sm:flex-row sm:items-start sm:gap-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">
                  {selectionEnabled ? (
                    <div className="flex h-14 w-5 shrink-0 items-center justify-center">
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

                  <Link href={detailHref} className="shrink-0 cursor-pointer">
                    <DateBadge callDate={booking.call_date} />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Link
                        href={detailHref}
                        className="min-w-0 truncate text-sm font-semibold text-zinc-900 hover:text-[var(--admin-accent)] dark:text-zinc-50"
                      >
                        {booking.vessel_name}
                      </Link>
                      <BookingStatusBadge
                        status={getBookingBadgeStatus(booking)}
                      />
                      {booking.confirmation_pdf_url ? (
                        <ConfirmationPdfButton
                          href={booking.confirmation_pdf_url}
                          compact
                        />
                      ) : null}
                    </div>
                    <Link
                      href={detailHref}
                      className="mt-1 flex min-w-0 cursor-pointer items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-300"
                    >
                      <MapPin
                        className="h-3.5 w-3.5 shrink-0 text-zinc-400"
                        aria-hidden
                      />
                      <span className="truncate">
                        {booking.port_name}
                        <span className="text-zinc-400"> · </span>
                        {booking.shipping_line_name}
                      </span>
                    </Link>
                  </div>
                </div>

                <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:max-w-[min(100%,28rem)] sm:shrink-0 sm:items-end">
                  <BookingMetaRow
                    className="justify-start sm:justify-end"
                    loaM={booking.vessel_loa_m}
                    eta={booking.eta}
                    etd={booking.etd}
                    positionLabel={positionLabel}
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
