"use client";

import { Ship } from "lucide-react";
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
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl bg-zinc-200/80 dark:bg-zinc-800"
          />
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
    <div className="grid gap-3 sm:grid-cols-2">
      {vessels.map((vessel) => {
        const selected = vessel.id === selectedId;
        return (
          <button
            key={vessel.id}
            type="button"
            onClick={() => onSelect(vessel.id)}
            className={[
              "flex cursor-pointer flex-col rounded-2xl border p-4 text-left transition-all duration-200",
              selected
                ? "border-[var(--admin-accent)] bg-[var(--admin-accent)]/8 shadow-md shadow-[var(--admin-accent)]/10"
                : "border-zinc-200/80 bg-white hover:border-[var(--admin-accent)]/35 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/80",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <span
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  selected
                    ? "bg-[var(--admin-accent)] text-white"
                    : "bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]",
                ].join(" ")}
              >
                <Ship className="h-5 w-5" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                  {vessel.name}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {vessel.shipping_line_name}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                  {vessel.loa_m && <span>LOA {vessel.loa_m} m</span>}
                  {vessel.draft_m && <span>Calado {vessel.draft_m} m</span>}
                  {vessel.pax_capacity != null && <span>{vessel.pax_capacity} PAX</span>}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
