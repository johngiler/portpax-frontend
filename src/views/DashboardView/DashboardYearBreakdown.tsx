"use client";

import {
  formatGrowthPct,
  reportMatrix,
} from "@/components/reports/reportMatrixStyles";
import type { DashboardKpiYearRow } from "@/types/dashboard";

function yoyTone(pct: number | null | undefined): string {
  if (pct == null) return reportMatrix.growthNeutral;
  if (pct > 0) return reportMatrix.growthPositive;
  if (pct < 0) return reportMatrix.growthNegative;
  return reportMatrix.growthNeutral;
}

type Props = {
  years: DashboardKpiYearRow[];
  formatValue: (row: DashboardKpiYearRow) => string;
  yoyKey?:
    | "bookings_yoy_pct"
    | "pax_yoy_pct"
    | "occupancy_yoy_pct"
    | "first_arrivals_yoy_pct"
    | "conflicts_yoy_pct";
};

/** Compact per-year lines inside a KPI card (multi-year ranges). */
export default function DashboardYearBreakdown({
  years,
  formatValue,
  yoyKey,
}: Props) {
  if (years.length <= 1) return null;
  return (
    <ul className="space-y-0.5 text-[10px] leading-snug tabular-nums text-zinc-600 dark:text-zinc-400">
      {years.map((row) => {
        const yoy = yoyKey ? row[yoyKey] : null;
        return (
          <li key={row.year} className="flex items-baseline gap-1.5">
            <span className="w-8 shrink-0 font-medium text-zinc-500 dark:text-zinc-500">
              {row.year}
            </span>
            <span className="min-w-0 font-semibold text-zinc-800 dark:text-zinc-200">
              {formatValue(row)}
            </span>
            {yoy != null ? (
              <span className={`shrink-0 ${yoyTone(yoy)}`}>
                {formatGrowthPct(yoy)}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
