"use client";

import { useMemo } from "react";
import { formatIsoDateLabel, parseIsoDate } from "@/lib/bookingDates";
import type { Booking } from "@/types/booking";
import { portDisplayName, type Port } from "@/types/catalog";
import { activeCountForDate } from "./occupancyUtils";
import {
  anchorFromElement,
  type TooltipAnchor,
} from "./OccupancyDayTooltip";
import { portAccentColor } from "./portColors";

type OccupancyPortMatrixProps = {
  dates: string[];
  ports: Port[];
  byPortDate: Record<number, Record<string, Booking[]>>;
  selectedDate: string | null;
  selectedPortId: number | null;
  onSelectCell: (portId: number, date: string, anchor: TooltipAnchor) => void;
  onHoverDate?: (date: string | null, anchor?: TooltipAnchor) => void;
};

function shortDayLabel(iso: string): string {
  const { day, monthIndex } = parseIsoDate(iso);
  const month = new Date(2000, monthIndex, 1).toLocaleDateString("es-MX", { month: "short" });
  return `${day} ${month}`;
}

function cellIntensity(count: number): string {
  if (count === 0) return "bg-zinc-100/80 dark:bg-zinc-800/40";
  if (count === 1) return "bg-[var(--admin-accent)]/25";
  if (count === 2) return "bg-[var(--admin-accent)]/45";
  return "bg-[var(--admin-accent)]/70";
}

export default function OccupancyPortMatrix({
  dates,
  ports,
  byPortDate,
  selectedDate,
  selectedPortId,
  onSelectCell,
  onHoverDate,
}: OccupancyPortMatrixProps) {
  const visibleDates = useMemo(() => {
    if (dates.length <= 21) return dates;
    if (selectedDate && dates.includes(selectedDate)) {
      const index = dates.indexOf(selectedDate);
      const start = Math.max(0, index - 10);
      return dates.slice(start, start + 21);
    }
    return dates.slice(0, 21);
  }, [dates, selectedDate]);

  if (ports.length === 0 || dates.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="border-b border-zinc-200/80 px-5 py-4 dark:border-zinc-800">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Mapa por puerto</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          Intensidad de ocupación · hover o click para ver el detalle
        </p>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid min-w-max"
          style={{
            gridTemplateColumns: `9.5rem repeat(${visibleDates.length}, minmax(2.5rem, 1fr))`,
          }}
        >
          <div className="sticky left-0 z-10 border-b border-r border-zinc-200/80 bg-zinc-50/95 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
            Puerto
          </div>
          {visibleDates.map((date) => (
            <div
              key={date}
              className={[
                "border-b border-zinc-200/80 px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wide dark:border-zinc-800",
                selectedDate === date
                  ? "bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]"
                  : "text-zinc-400",
              ].join(" ")}
            >
              {shortDayLabel(date)}
            </div>
          ))}

          {ports.map((port) => (
            <div key={port.id} className="contents">
              <div
                className={[
                  "sticky left-0 z-10 flex items-center gap-2 border-r border-zinc-200/80 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/95",
                  selectedPortId === port.id ? "bg-[var(--admin-accent)]/5" : "",
                ].join(" ")}
              >
                <span
                  className="h-8 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: portAccentColor(port.id) }}
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                    {portDisplayName(port)}
                  </p>
                </div>
              </div>

              {visibleDates.map((date) => {
                const cellBookings = byPortDate[port.id]?.[date] ?? [];
                const count = activeCountForDate(cellBookings);
                const isSelected =
                  selectedDate === date &&
                  (selectedPortId === null || selectedPortId === port.id);

                return (
                  <button
                    key={`${port.id}-${date}`}
                    type="button"
                    onClick={(e) =>
                      onSelectCell(port.id, date, anchorFromElement(e.currentTarget))
                    }
                    onMouseEnter={(e) =>
                      onHoverDate?.(date, anchorFromElement(e.currentTarget))
                    }
                    onMouseLeave={() => onHoverDate?.(null)}
                    aria-label={`${portDisplayName(port)} · ${formatIsoDateLabel(date, "short")} · ${count} escala${count === 1 ? "" : "s"}`}
                    className={[
                      "group relative h-11 border-b border-r border-zinc-200/40 transition-all hover:brightness-95 dark:border-zinc-800/60",
                      cellIntensity(count),
                      isSelected ? "ring-2 ring-inset ring-[var(--admin-accent)]" : "",
                    ].join(" ")}
                  >
                    {count > 0 ? (
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-sm">
                        {count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {dates.length > visibleDates.length ? (
        <p className="border-t border-zinc-200/80 px-5 py-2 text-[10px] text-zinc-400 dark:border-zinc-800">
          Mostrando {visibleDates.length} de {dates.length} días. Selecciona un día en el calendario para centrar la ventana.
        </p>
      ) : null}
    </div>
  );
}
