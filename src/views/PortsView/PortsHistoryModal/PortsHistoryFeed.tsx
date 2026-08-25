"use client";

import {
  ArrowRight,
  CalendarClock,
  MapPin,
  MapPinPlus,
  MapPinX,
  User,
} from "lucide-react";
import { auditFieldChangeLines } from "@/lib/auditChangeLines";
import { formatAuditActorDisplay } from "@/lib/auditActor";
import type { PortActivityItem } from "@/services/catalogs/portActivityService";

type PortsHistoryFeedProps = {
  items: PortActivityItem[];
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
};

function actionLabel(action: string): string {
  switch (action) {
    case "created":
      return "Creación";
    case "updated":
      return "Actualización";
    case "deleted":
      return "Eliminación";
    default:
      return action;
  }
}

function portTitle(item: PortActivityItem): string {
  const code = item.port_code?.trim();
  const name = item.port_name?.trim();
  if (code && name && name.toLowerCase() !== code.toLowerCase()) {
    return `${name} · ${code}`;
  }
  return name || code || "Puerto";
}

function headline(item: PortActivityItem): string {
  const who = portTitle(item);
  switch (item.action) {
    case "created":
      return `Creó ${who}`;
    case "updated":
      return `Modificó ${who}`;
    case "deleted":
      return `Eliminó ${who}`;
    default:
      return item.summary || who;
  }
}

function ActionIcon({ action }: { action: string }) {
  const className =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl";
  if (action === "created") {
    return (
      <div
        className={`${className} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200`}
      >
        <MapPinPlus className="h-5 w-5" strokeWidth={2} aria-hidden />
      </div>
    );
  }
  if (action === "deleted") {
    return (
      <div
        className={`${className} bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200`}
      >
        <MapPinX className="h-5 w-5" strokeWidth={2} aria-hidden />
      </div>
    );
  }
  return (
    <div
      className={`${className} bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200`}
    >
      <MapPin className="h-5 w-5" strokeWidth={2} aria-hidden />
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

export default function PortsHistoryFeed({
  items,
  hasActiveFilters = false,
  onClearFilters,
}: PortsHistoryFeedProps) {
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
            : "Las altas, cambios y bajas de puertos aparecerán aquí."}
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
        const fieldLines = auditFieldChangeLines(item.changes);
        const when = new Date(item.occurred_at).toLocaleString("es-MX", {
          dateStyle: "medium",
          timeStyle: "short",
        });

        return (
          <li
            key={`${item.action}-${item.port_code}-${item.occurred_at}-${index}`}
            className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80"
          >
            <div className="flex items-start gap-3">
              <ActionIcon action={item.action} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-800 dark:bg-sky-900/40 dark:text-sky-200">
                    {actionLabel(item.action)}
                  </span>
                </div>

                <p className="mt-1.5 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {headline(item)}
                </p>

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

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-zinc-100 pt-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Por{" "}
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">
                      {formatAuditActorDisplay(item.actor_display)}
                    </span>
                  </span>
                  <span>{when}</span>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
