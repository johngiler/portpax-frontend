"use client";

import { Check, Ship } from "lucide-react";
import type { Vessel } from "@/types/cruise";

type VesselStepProps = {
  vessels: Vessel[];
  selectedId: number | null;
  onSelect: (vesselId: number) => void;
  loading: boolean;
};

export default function VesselStep({ vessels, selectedId, onSelect, loading }: VesselStepProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800"
          >
            <div className="aspect-[5/4] animate-pulse bg-zinc-200/80 dark:bg-zinc-800" />
            <div className="space-y-2 p-3">
              <div className="h-3.5 w-full animate-pulse rounded bg-zinc-200/80 dark:bg-zinc-800" />
              <div className="h-2.5 w-2/3 animate-pulse rounded bg-zinc-200/60 dark:bg-zinc-800/80" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (vessels.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
        No hay barcos activos para esta naviera.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {vessels.map((vessel) => {
        const selected = vessel.id === selectedId;
        return (
          <button
            key={vessel.id}
            type="button"
            onClick={() => onSelect(vessel.id)}
            className={[
              "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border text-left shadow-[var(--admin-card-shadow)] transition-all duration-200",
              selected
                ? "scale-[1.02] border-2 border-[var(--admin-accent)] shadow-lg shadow-[var(--admin-accent)]/25 ring-4 ring-[var(--admin-accent)]/15"
                : "border-zinc-200/80 bg-white hover:-translate-y-0.5 hover:border-[var(--admin-accent)]/30 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/80",
            ].join(" ")}
          >
            {selected && (
              <span
                className="pointer-events-none absolute inset-0 z-10 rounded-2xl bg-[var(--admin-accent)]/8"
                aria-hidden
              />
            )}
            <div
              className={[
                "relative flex aspect-[5/4] items-center justify-center bg-gradient-to-br from-[var(--admin-accent)]/8 via-zinc-50 to-zinc-100 dark:from-[var(--admin-accent)]/15 dark:via-zinc-900 dark:to-zinc-950",
                selected ? "from-[var(--admin-accent)]/20" : "",
              ].join(" ")}
            >
              {selected && (
                <span
                  className="pointer-events-none absolute inset-0 bg-[var(--admin-accent)]/20"
                  aria-hidden
                />
              )}
              {vessel.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={vessel.logo}
                  alt=""
                  className="max-h-[70%] max-w-[75%] relative z-[1] object-contain transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <span className="relative z-[1] flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
                  <Ship className="h-5 w-5" strokeWidth={2} />
                </span>
              )}
              {selected && (
                <span
                  className="absolute left-3 top-3 z-[2] flex h-9 w-9 items-center justify-center rounded-full bg-[var(--admin-accent)] text-white shadow-md shadow-[var(--admin-accent)]/40"
                  aria-hidden
                >
                  <Check className="h-5 w-5" strokeWidth={2.5} />
                </span>
              )}
            </div>
            <div
              className={[
                "relative z-[1] flex flex-col gap-1 p-3",
                selected
                  ? "bg-[var(--admin-accent)]/10 dark:bg-[var(--admin-accent)]/15"
                  : "bg-white dark:bg-zinc-900/80",
              ].join(" ")}
            >
              <p
                className={[
                  "line-clamp-2 text-xs font-semibold leading-snug sm:text-sm",
                  selected
                    ? "text-[var(--admin-accent)]"
                    : "text-zinc-900 dark:text-zinc-50",
                ].join(" ")}
              >
                {vessel.name}
              </p>
              <p className="line-clamp-1 text-[10px] text-zinc-500 sm:text-[11px]">
                {vessel.shipping_line_name}
              </p>
              <div className="mt-0.5 flex flex-wrap gap-x-1.5 gap-y-0.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 sm:text-[11px]">
                {vessel.loa_m && <span>LOA {vessel.loa_m} m</span>}
                {vessel.draft_m && <span>· {vessel.draft_m} m calado</span>}
                {vessel.pax_capacity != null && <span>· {vessel.pax_capacity} PAX</span>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
