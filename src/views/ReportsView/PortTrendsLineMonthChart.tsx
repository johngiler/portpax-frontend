"use client";

import { useMemo, useState } from "react";
import ChartCard from "@/views/DashboardView/charts/ChartCard";
import PortMonthComboChart from "@/views/DashboardView/charts/PortMonthComboChart";
import type { PortTrendsLineMonthSeries } from "@/services/bookings/bookingService";
import { ChartLine, Table2 } from "lucide-react";

type Props = {
  lines: PortTrendsLineMonthSeries[];
};

export default function PortTrendsLineMonthChart({ lines }: Props) {
  const [mode, setMode] = useState<"chart" | "table">("chart");
  const data = useMemo(
    () => ({
      ports: lines.map((line) => ({
        port_id: line.shipping_line_id,
        name: line.name,
        code: line.code,
        months: line.months,
      })),
    }),
    [lines],
  );

  if (!lines.length) return null;

  return (
    <ChartCard
      title="Pasajeros por mes y naviera"
      description="Líneas = PAX (eje izq.) · barras = calls (eje der.)."
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
      <PortMonthComboChart data={data} mode={mode} seriesLabel="Naviera" />
    </ChartCard>
  );
}
