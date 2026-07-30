"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CalendarClock,
  ChevronRight,
  FileSpreadsheet,
  Pencil,
  Ship,
  User,
} from "lucide-react";
import { currentReturnTo } from "@/lib/safeReturnTo";
import { bookingDetailHref } from "@/types/booking";
import type { BookingActivityItem } from "@/services/bookings/bookingActivityService";

type HistoryFeedProps = {
  items: BookingActivityItem[];
  onOpenBatch: (batchId: number) => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
};

function actionLabel(action: string): string {
  switch (action) {
    case "created":
      return "Creación";
    case "operational_update":
      return "Actualización operativa";
    case "status_change":
      return "Cambio de estado";
    case "bulk_create":
      return "Importación masiva";
    default:
      return action;
  }
}

function KindBadge({ kind }: { kind: "single" | "bulk" }) {
  const isBulk = kind === "bulk";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
        isBulk
          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
          : "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200"
      }`}
    >
      {isBulk ? "Masiva" : "Única"}
    </span>
  );
}

function KindIcon({ kind }: { kind: "single" | "bulk" }) {
  if (kind === "bulk") {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
        <FileSpreadsheet className="h-5 w-5" strokeWidth={2} aria-hidden />
      </div>
    );
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200">
      <Ship className="h-5 w-5" strokeWidth={2} aria-hidden />
    </div>
  );
}

export default function HistoryFeed({
  items,
  onOpenBatch,
  hasActiveFilters = false,
  onClearFilters,
}: HistoryFeedProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = currentReturnTo(pathname, searchParams);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
        <CalendarClock
          className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600"
          strokeWidth={1.75}
          aria-hidden
        />
        <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">
          No hay movimientos en este rango.
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {hasActiveFilters
            ? "Prueba limpiar los filtros del historial."
            : "Crea reservas únicas o importa un Excel para ver actividad aquí."}
        </p>
        {hasActiveFilters && onClearFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-4 cursor-pointer text-sm font-medium text-[var(--admin-accent)] hover:underline"
          >
            Limpiar filtros
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => {
        const key =
          item.kind === "bulk"
            ? `bulk-${item.batch_id}`
            : `single-${item.booking_id}-${item.occurred_at}-${index}`;
        const isBulk = item.kind === "bulk";
        const cardClass =
          "group flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-[var(--admin-card-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--admin-accent)]/30 hover:shadow-lg sm:items-center sm:gap-4 dark:border-zinc-800 dark:bg-zinc-900/80";

        const body = (
          <>
            <KindIcon kind={item.kind} />            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <KindBadge kind={item.kind} />
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {actionLabel(item.action)}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {item.summary}
              </p>
              {isBulk && item.label ? (
                <p className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-300">
                  {item.label}
                </p>
              ) : null}
              {!isBulk && item.booking_code ? (
                <code className="mt-1.5 inline-block max-w-full truncate rounded-md bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-500 dark:bg-zinc-950/60 dark:text-zinc-400">
                  {item.booking_code}
                </code>
              ) : null}
              {isBulk ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {item.created_count ?? 0} creadas
                  </span>
                  <span className="inline-flex items-center rounded-lg bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                    {item.failed_count ?? 0} fallidas
                  </span>
                  <span className="inline-flex items-center rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    {item.not_created_count ?? 0} no creadas
                  </span>
                </div>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                {item.user_display ? (
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {item.user_display}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {new Date(item.occurred_at).toLocaleString("es-MX")}
                </span>
              </div>
            </div>
            <div className="hidden shrink-0 self-center sm:block">
              <ChevronRight
                className="h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--admin-accent)]"
                strokeWidth={2}
                aria-hidden
              />
            </div>
          </>
        );

        if (isBulk && item.batch_id != null) {
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onOpenBatch(item.batch_id!)}
                className={`${cardClass} w-full text-left`}
              >
                {body}
              </button>
            </li>
          );
        }

        if (item.booking_code) {
          return (
            <li key={key}>
              <Link
                href={bookingDetailHref(
                  { booking_code: item.booking_code },
                  { returnTo },
                )}
                className={cardClass}
              >
                {body}
              </Link>
            </li>
          );
        }

        return (
          <li key={key} className={cardClass}>
            {body}
          </li>
        );
      })}
    </ul>
  );
}
