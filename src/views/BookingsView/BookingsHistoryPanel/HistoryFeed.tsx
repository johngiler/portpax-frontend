"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  ChevronRight,
  FileSpreadsheet,
  Ship,
  User,
} from "lucide-react";
import {
  auditEntityHint,
  auditFieldChangeLines,
} from "@/lib/auditChangeLines";
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
    case "lta_linked":
      return "Vinculación LTA";
    case "bulk_create":
      return "Importación";
    default:
      return action;
  }
}

function headline(item: BookingActivityItem): string {
  if (item.kind === "bulk") {
    return item.label?.trim() || "Importación masiva";
  }
  switch (item.action) {
    case "created":
      return "Creó una reserva";
    case "operational_update":
      return item.summary?.startsWith("Override")
        ? item.summary
        : "Actualizó la reserva";
    case "status_change":
      return item.summary || "Cambió el estado";
    case "lta_linked":
      return item.summary || "Vinculó acuerdo LTA";
    default:
      return item.summary || "Movimiento de reserva";
  }
}

function ActionIcon({ kind }: { kind: "single" | "bulk" }) {
  const className =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl";
  if (kind === "bulk") {
    return (
      <div
        className={`${className} bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200`}
      >
        <FileSpreadsheet className="h-5 w-5" strokeWidth={2} aria-hidden />
      </div>
    );
  }
  return (
    <div
      className={`${className} bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200`}
    >
      <Ship className="h-5 w-5" strokeWidth={2} aria-hidden />
    </div>
  );
}

function ChangeChip({ label, text }: { label: string; text: string }) {
  const arrowSplit = text.includes(" → ");
  const [from, to] = arrowSplit ? text.split(" → ") : [null, text];

  return (
    <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-2.5 py-1.5 dark:border-zinc-700 dark:bg-zinc-950/50">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      {arrowSplit && from != null ? (
        <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-zinc-700 dark:text-zinc-200">
          <span className="text-zinc-500 line-through decoration-zinc-300 dark:text-zinc-400">
            {from}
          </span>
          <ArrowRight
            className="h-3 w-3 shrink-0 text-zinc-400"
            strokeWidth={2}
            aria-hidden
          />
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {to}
          </span>
        </p>
      ) : (
        <p className="mt-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-100">
          {text}
        </p>
      )}
    </div>
  );
}

function CountChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "err" | "warn";
}) {
  const toneClass =
    tone === "ok"
      ? "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
      : tone === "err"
        ? "border-red-200/80 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        : "border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300";

  return (
    <div
      className={`rounded-lg border px-2.5 py-1.5 ${toneClass}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
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
        const fieldLines = !isBulk
          ? auditFieldChangeLines(item.changes)
          : [];
        const entityHint = !isBulk
          ? auditEntityHint(item.changes) ||
            (item.entity
              ? [
                  item.entity.port_code || item.entity.port_name,
                  item.entity.vessel_name,
                  item.entity.call_date,
                ]
                  .filter(Boolean)
                  .join(" · ") || null
              : null)
          : null;
        const when = new Date(item.occurred_at).toLocaleString("es-MX", {
          dateStyle: "medium",
          timeStyle: "short",
        });
        const interactive =
          (isBulk && item.batch_id != null) || Boolean(item.booking_code);

        const cardClass = `rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-[var(--admin-card-shadow)] transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-900/80 ${
          interactive
            ? "group cursor-pointer hover:-translate-y-0.5 hover:border-[var(--admin-accent)]/30 hover:shadow-lg"
            : ""
        }`;

        const body = (
          <div className="flex items-start gap-3">
            <ActionIcon kind={item.kind} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    isBulk
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                      : "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200"
                  }`}
                >
                  {actionLabel(item.action)}
                </span>
              </div>

              <p className="mt-1.5 flex flex-wrap items-center gap-2 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                <span>{headline(item)}</span>
                {!isBulk && item.booking_code ? (
                  <code className="inline-flex max-w-full truncate rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {item.booking_code}
                  </code>
                ) : null}
              </p>

              {entityHint ? (
                <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {entityHint}
                </p>
              ) : null}

              {isBulk ? (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <CountChip
                    label="Creadas"
                    value={item.created_count ?? 0}
                    tone="ok"
                  />
                  <CountChip
                    label="Fallidas"
                    value={item.failed_count ?? 0}
                    tone="err"
                  />
                  <CountChip
                    label="No creadas"
                    value={item.not_created_count ?? 0}
                    tone="warn"
                  />
                </div>
              ) : null}

              {fieldLines.length > 0 ? (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {fieldLines.map((line) => (
                    <ChangeChip
                      key={line.field}
                      label={line.label}
                      text={line.text}
                    />
                  ))}
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-2.5 dark:border-zinc-800">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {item.user_display ? (
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Por{" "}
                      <span className="font-medium text-zinc-700 dark:text-zinc-200">
                        {item.user_display}
                      </span>
                    </span>
                  ) : null}
                  <span>{when}</span>
                </div>
                {interactive ? (
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--admin-accent)]"
                    strokeWidth={2}
                    aria-hidden
                  />
                ) : null}
              </div>
            </div>
          </div>
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
                className={`block ${cardClass}`}
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
