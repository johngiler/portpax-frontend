"use client";

import { Anchor } from "lucide-react";
import ViewSection from "@/components/layout/ViewSection";
import type { DashboardOccupancyPortRow } from "@/types/dashboard";

type DashboardOccupancyByPortProps = {
  rows: DashboardOccupancyPortRow[];
};

export default function DashboardOccupancyByPort({ rows }: DashboardOccupancyByPortProps) {
  const maxPct = Math.max(...rows.map((r) => r.occupancy_pct), 1);

  return (
    <ViewSection
      icon={Anchor}
      title="Ocupación por puerto"
      description="Porcentaje de slot-días ocupados (muelles pier) en el período filtrado."
      className="mb-6"
    >
      <div className="px-5 py-4 sm:px-6">
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No hay puertos en alcance para calcular ocupación.
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.port_id}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate font-medium text-zinc-900 dark:text-zinc-50">
                    {row.name}
                  </span>
                  <span className="shrink-0 tabular-nums text-zinc-600 dark:text-zinc-300">
                    {row.occupancy_pct}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-[var(--admin-accent)] transition-[width]"
                    style={{ width: `${Math.min(100, (row.occupancy_pct / maxPct) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  {row.occupied_slot_days.toLocaleString("es")} de{" "}
                  {row.capacity_slot_days.toLocaleString("es")} slot-días · {row.position_count}{" "}
                  muelles
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ViewSection>
  );
}
