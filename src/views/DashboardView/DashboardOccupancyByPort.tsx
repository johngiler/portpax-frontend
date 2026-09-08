"use client";

import { useMemo, useState } from "react";
import { Anchor } from "lucide-react";
import ViewSection from "@/components/layout/ViewSection";
import type {
  DashboardOccupancyDockRow,
  DashboardOccupancyPortRow,
  DashboardOccupancyTrends,
} from "@/types/dashboard";

const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

type OccupancyTab = "period" | "month" | "season" | "dock";

type DashboardOccupancyByPortProps = {
  rows: DashboardOccupancyPortRow[];
  trends?: DashboardOccupancyTrends;
};

function OccupancyBars({
  rows,
}: {
  rows: Array<{
    key: string | number;
    title: string;
    subtitle?: string;
    occupancy_pct: number;
    hint: string;
  }>;
}) {
  const maxPct = Math.max(...rows.map((r) => r.occupancy_pct), 1);
  if (rows.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No hay datos de ocupación para esta vista.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <div className="min-w-0">
              <span className="block truncate font-medium text-zinc-900 dark:text-zinc-50">
                {row.title}
              </span>
              {row.subtitle ? (
                <span className="block text-[11px] text-zinc-400">
                  {row.subtitle}
                </span>
              ) : null}
            </div>
            <span className="shrink-0 tabular-nums text-zinc-600 dark:text-zinc-300">
              {row.occupancy_pct}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/50 dark:bg-zinc-800/60">
            <div
              className="h-full rounded-full bg-[#7c3aed] transition-[width]"
              style={{
                width: `${Math.min(100, (row.occupancy_pct / maxPct) * 100)}%`,
              }}
            />
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            {row.hint}
          </p>
        </li>
      ))}
    </ul>
  );
}

function portRowsToBars(rows: DashboardOccupancyPortRow[]) {
  return rows.map((row) => ({
    key: row.port_id,
    title: row.name,
    occupancy_pct: row.occupancy_pct,
    hint: `${row.occupied_slot_days.toLocaleString("es")} de ${row.capacity_slot_days.toLocaleString("es")} slot-días · ${row.position_count} muelles`,
  }));
}

function dockRowsToBars(rows: DashboardOccupancyDockRow[]) {
  return rows.map((row) => ({
    key: row.position_id,
    title: row.code,
    subtitle: row.port_name,
    occupancy_pct: row.occupancy_pct,
    hint: `${row.occupied_slot_days.toLocaleString("es")} de ${row.capacity_slot_days.toLocaleString("es")} slot-días`,
  }));
}

export default function DashboardOccupancyByPort({
  rows,
  trends,
}: DashboardOccupancyByPortProps) {
  const [tab, setTab] = useState<OccupancyTab>("period");
  const [monthIdx, setMonthIdx] = useState(0);
  const [seasonIdx, setSeasonIdx] = useState(0);

  const monthSlices = trends?.by_month ?? [];
  const seasonSlices = trends?.by_season ?? [];
  const dockRows = trends?.by_dock ?? [];

  const safeMonthIdx = Math.min(monthIdx, Math.max(monthSlices.length - 1, 0));
  const safeSeasonIdx = Math.min(
    seasonIdx,
    Math.max(seasonSlices.length - 1, 0),
  );

  const tabs: { id: OccupancyTab; label: string }[] = [
    { id: "period", label: "Período" },
    { id: "month", label: "Por mes" },
    { id: "season", label: "Temporada" },
    { id: "dock", label: "Muelles" },
  ];

  const content = useMemo(() => {
    if (tab === "period") return portRowsToBars(rows);
    if (tab === "month") {
      const slice = monthSlices[safeMonthIdx];
      return portRowsToBars(slice?.by_port ?? []);
    }
    if (tab === "season") {
      const slice = seasonSlices[safeSeasonIdx];
      return portRowsToBars(slice?.by_port ?? []);
    }
    return dockRowsToBars(dockRows);
  }, [
    tab,
    rows,
    monthSlices,
    seasonSlices,
    dockRows,
    safeMonthIdx,
    safeSeasonIdx,
  ]);

  return (
    <ViewSection
      icon={Anchor}
      title="Ocupación por puerto"
      description="Slot-días ocupados vs capacidad. Tendencia por mes, temporada ITM y muelles."
      className="mb-6"
      accent="#7c3aed"
    >
      <div className="px-5 py-4 sm:px-6">
        <div className="mb-4 inline-flex flex-wrap gap-1 rounded-xl border border-white/50 bg-white/45 p-1 shadow-sm backdrop-blur-md dark:border-zinc-700/40 dark:bg-zinc-900/35">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={[
                "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors",
                tab === item.id
                  ? "bg-[#7c3aed] text-white shadow-sm"
                  : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "month" && monthSlices.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {monthSlices.map((slice, index) => (
              <button
                key={`${slice.year}-${slice.month}`}
                type="button"
                onClick={() => setMonthIdx(index)}
                className={[
                  "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  index === safeMonthIdx
                    ? "border-[#7c3aed]/40 bg-[#7c3aed]/15 text-[#5b21b6] dark:text-violet-200"
                    : "border-white/40 bg-white/40 text-zinc-500 hover:bg-white/70 dark:border-zinc-700/40 dark:bg-zinc-900/30 dark:hover:bg-zinc-800/60",
                ].join(" ")}
              >
                {MONTH_LABELS[(slice.month ?? 1) - 1]} {slice.year}
              </button>
            ))}
          </div>
        ) : null}

        {tab === "season" && seasonSlices.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {seasonSlices.map((slice, index) => (
              <button
                key={`${slice.season}-${slice.date_from}`}
                type="button"
                onClick={() => setSeasonIdx(index)}
                className={[
                  "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  index === safeSeasonIdx
                    ? "border-[#7c3aed]/40 bg-[#7c3aed]/15 text-[#5b21b6] dark:text-violet-200"
                    : "border-white/40 bg-white/40 text-zinc-500 hover:bg-white/70 dark:border-zinc-700/40 dark:bg-zinc-900/30 dark:hover:bg-zinc-800/60",
                ].join(" ")}
              >
                {slice.label}
              </button>
            ))}
          </div>
        ) : null}

        <OccupancyBars rows={content} />
      </div>
    </ViewSection>
  );
}
