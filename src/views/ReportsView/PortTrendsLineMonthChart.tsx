"use client";

import { useMemo, useState } from "react";
import ChartCard from "@/views/DashboardView/charts/ChartCard";
import PortMonthComboChart from "@/views/DashboardView/charts/PortMonthComboChart";
import type { PortTrendsLinePeriodSeries } from "@/services/bookings/bookingService";
import { ChartLine, Table2 } from "lucide-react";

type Props = {
  lines: PortTrendsLinePeriodSeries[];
  labels: string[];
  seasonMode: boolean;
};

export default function PortTrendsLineMonthChart({
  lines,
  labels,
  seasonMode,
}: Props) {
  const [mode, setMode] = useState<"chart" | "table">("chart");
  const data = useMemo(
    () => ({
      ports: lines.map((line) => ({
        port_id: line.shipping_line_id,
        name: line.name,
        code: line.code,
        months: line.points.map((point, index) => ({
          month: index + 1,
          calls: point.calls,
          passengers: point.passengers,
        })),
      })),
    }),
    [lines],
  );

  if (!lines.length) return null;

  return (
    <ChartCard
      title={
        seasonMode
          ? "Pasajeros y escalas por temporada"
          : "Pasajeros y escalas por año"
      }
      accent="#3478b5"
      actions={
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200/80 bg-white/80 p-0.5 dark:border-zinc-700 dark:bg-zinc-900/80">
          <button
            type="button"
            aria-label="Vista gráfico"
            onClick={() => setMode("chart")}
            className={[
              "rounded-md p-1.5 transition-colors",
              mode === "chart"
                ? "bg-[var(--admin-accent)]/15 text-[var(--admin-accent)]"
                : "text-zinc-400 hover:text-zinc-600",
            ].join(" ")}
          >
            <ChartLine className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Vista tabla"
            onClick={() => setMode("table")}
            className={[
              "rounded-md p-1.5 transition-colors",
              mode === "table"
                ? "bg-[var(--admin-accent)]/15 text-[var(--admin-accent)]"
                : "text-zinc-400 hover:text-zinc-600",
            ].join(" ")}
          >
            <Table2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      }
    >
      <PortMonthComboChart
        data={data}
        mode={mode}
        seriesLabel="Naviera"
        categoryLabels={labels}
      />
    </ChartCard>
  );
}
