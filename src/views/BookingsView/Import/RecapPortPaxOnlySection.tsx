"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import InfiniteScrollFooter from "@/components/ui/InfiniteScrollFooter";
import { formatIsoDateLabel } from "@/lib/bookingDates";
import type { BookingRecapPortPaxOnly } from "@/services/bookings/bulkImportService";
import { bookingDetailHref } from "@/types/booking";

const PAGE_SIZE = 10;

type RecapPortPaxOnlySectionProps = {
  rows: BookingRecapPortPaxOnly[];
  returnTo?: string;
};

/** PortPax bookings in the recap date window that were not on the paste. */
export default function RecapPortPaxOnlySection({
  rows,
  returnTo,
}: RecapPortPaxOnlySectionProps) {
  const rowsKey = useMemo(
    () =>
      `${rows.length}:${rows[0]?.booking_id ?? ""}:${rows[rows.length - 1]?.booking_id ?? ""}`,
    [rows],
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [rowsKey]);

  if (rows.length === 0) return null;

  const visibleRows = rows.slice(0, visibleCount);
  const hasMore = visibleCount < rows.length;

  return (
    <div className="mb-4 space-y-2 rounded-lg border border-sky-200/90 bg-sky-50/40 p-3 dark:border-sky-900/40 dark:bg-sky-950/15">
      <p className="text-sm font-semibold text-sky-900 dark:text-sky-200">
        {rows.length}{" "}
        {rows.length === 1
          ? "reserva en PortPax no está en el recap"
          : "reservas en PortPax no están en el recap"}{" "}
        (mismo puerto y rango Desde–Hasta).
      </p>
      <ul className="space-y-1.5">
        {visibleRows.map((row) => {
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
              <Link
                href={bookingDetailHref(
                  { booking_code: row.booking_code },
                  returnTo ? { returnTo } : undefined,
                )}
                className="font-semibold text-[var(--admin-accent)] underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.booking_code}
              </Link>
              {meta ? (
                <span className="mt-0.5 block text-xs text-sky-800/90 dark:text-sky-200/80">
                  {meta}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      {rows.length > PAGE_SIZE ? (
        <InfiniteScrollFooter
          mode="button"
          hasMore={hasMore}
          loading={false}
          onLoadMore={() =>
            setVisibleCount((n) => Math.min(n + PAGE_SIZE, rows.length))
          }
          loadedCount={visibleRows.length}
          totalCount={rows.length}
          itemLabel="reservas"
          className="!mt-3 !pb-0"
        />
      ) : null}
    </div>
  );
}
