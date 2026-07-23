"use client";

import InfoTooltip from "@/components/ui/InfoTooltip";

/** Compact matrix key for availability charts. */
export default function AvailabilityColorLegend() {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
      <span className="inline-flex items-center gap-1.5">
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
          aria-hidden
        />
        Disponible
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600"
          aria-hidden
        />
        Pasado
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="h-2 w-2 shrink-0 rounded-sm border border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800"
          aria-hidden
        />
        Ocupada
      </span>
      <InfoTooltip
        label="Leyenda de disponibilidad"
        content="Verde: posición libre hoy o en el futuro. Gris: día pasado (no reservable). Cuadro: escala asignada a esa posición (naviera, barco y LOA)."
      />
    </div>
  );
}
