"use client";

import InAppLink from "@/components/ui/InAppLink";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import type { BookingRecapPortPaxOnly } from "@/services/bookings/bulkImportService";
import { bookingDetailHref } from "@/types/booking";

type RecapPortPaxOnlySectionProps = {
  rows: BookingRecapPortPaxOnly[];
  totalCount: number;
  hasMore: boolean;
  loadingMore?: boolean;
  onLoadMore: () => void | Promise<void>;
  returnTo?: string;
};

/** PortPax bookings in the recap date window that were not on the paste. */
export default function RecapPortPaxOnlySection({
  rows,
  totalCount,
  hasMore,
  loadingMore = false,
  onLoadMore,
  returnTo,
}: RecapPortPaxOnlySectionProps) {
  if (totalCount <= 0 && rows.length === 0) return null;

  const count = totalCount > 0 ? totalCount : rows.length;

  return (
    <div className="mb-4 space-y-2 rounded-lg border border-sky-200/90 bg-sky-50/40 p-3 dark:border-sky-900/40 dark:bg-sky-950/15">
      <p className="text-sm font-semibold text-sky-900 dark:text-sky-200">
        {count}{" "}
        {count === 1
          ? "reserva en PortPax no está en el recap"
          : "reservas en PortPax no están en el recap"}{" "}
        (mismo puerto y rango Desde–Hasta).
      </p>
      <ul className="space-y-1.5">
        {rows.map((row) => {
          const dateLabel = row.call_date
            ? formatIsoDateLabel(row.call_date, "short")
            : "—";
          const schedule = [row.eta, row.etd].filter(Boolean).join("–");
          const meta = [
            row.vessel_name,
            row.port_name,
            dateLabel,
            schedule || null,
            row.status_display || null,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <li
              key={row.booking_id}
              className="rounded-md border border-sky-200/70 bg-white/80 px-3 py-2 text-sm text-sky-950 dark:border-sky-900/50 dark:bg-zinc-950/40 dark:text-sky-100"
            >
              <InAppLink
                href={bookingDetailHref(
                  { booking_code: row.booking_code },
                  returnTo ? { returnTo } : undefined,
                )}
                className="font-semibold text-[var(--admin-accent)] underline-offset-2 hover:underline"
              >
                {row.booking_code}
              </InAppLink>
              {meta ? (
                <span className="mt-0.5 block text-xs text-sky-800/90 dark:text-sky-200/80">
                  {meta}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      {count > rows.length || hasMore ? (
        <InfiniteScrollFooter
          mode="button"
          hasMore={hasMore}
          loading={loadingMore}
          onLoadMore={onLoadMore}
          loadedCount={rows.length}
          totalCount={count}
          itemLabel="reservas"
          className="!mt-3 !pb-0"
        />
      ) : null}
    </div>
  );
}
