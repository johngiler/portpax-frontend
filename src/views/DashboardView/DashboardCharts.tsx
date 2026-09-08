"use client";

import { useState } from "react";
import { ChartLine, Table2 } from "lucide-react";
import type { DashboardStats } from "@/types/dashboard";
import ChartCard from "./charts/ChartCard";
import DonutChart from "./charts/DonutChart";
import HorizontalBarChart from "./charts/HorizontalBarChart";
import PortMonthComboChart from "./charts/PortMonthComboChart";
import VerticalGroupedBars from "./charts/VerticalGroupedBars";

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

const STATUS_COLORS: Record<string, string> = {
  h: "#f59e0b",
  co: "#3478b5",
  cl: "#1d4ed8",
  lta: "#06b6d4",
  r: "#ef4444",
  c: "#7f1d1d",
};

type DashboardChartsProps = {
  stats: DashboardStats;
};

export default function DashboardCharts({ stats }: DashboardChartsProps) {
  const [portMonthMode, setPortMonthMode] = useState<"chart" | "table">("chart");

  const monthCategories = MONTH_LABELS;
  const monthValues: Record<string, Record<string, number>> = {};
  for (const row of stats.by_month) {
    const label = MONTH_LABELS[row.month - 1];
    monthValues[label] = {
      nr: row.nr,
      co: row.co,
      c: row.c,
    };
  }

  const statusSlices = stats.status_breakdown.map((slice) => ({
    key: slice.status,
    label: slice.label,
    value: slice.count,
    color: STATUS_COLORS[slice.status] ?? "#71717a",
  }));
  const statusTotal = statusSlices.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ChartCard
        title="Pasajeros por mes y puerto"
        description="Zona baja ampliada hasta el máx. de calls (≥100); arriba escala pax en xK."
        accent="#3478b5"
        className="lg:col-span-2"
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-zinc-200/80 bg-white/80 p-0.5 dark:border-zinc-700 dark:bg-zinc-900/80">
            <button
              type="button"
              aria-label="Vista gráfico"
              onClick={() => setPortMonthMode("chart")}
              className={[
                "rounded-md p-1.5 transition-colors",
                portMonthMode === "chart"
                  ? "bg-[var(--admin-accent)]/15 text-[var(--admin-accent)]"
                  : "text-zinc-400 hover:text-zinc-600",
              ].join(" ")}
            >
              <ChartLine className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              aria-label="Vista tabla"
              onClick={() => setPortMonthMode("table")}
              className={[
                "rounded-md p-1.5 transition-colors",
                portMonthMode === "table"
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
          data={stats.by_port_month ?? { ports: [] }}
          mode={portMonthMode}
        />
      </ChartCard>

      <ChartCard
        title="Reservas por estado"
        description="Distribución de estados en el período filtrado."
        accent="#3478b5"
      >
        <DonutChart
          centerLabel="Total"
          centerValue={statusTotal}
          slices={statusSlices}
        />
      </ChartCard>

      <ChartCard
        title="Reservas por mes"
        description="Tendencia mensual por estado."
        accent="#d97706"
      >
        <VerticalGroupedBars
          categories={monthCategories}
          series={[
            { key: "co", label: "Confirmadas", color: STATUS_COLORS.co },
            { key: "nr", label: "Solicitadas", color: "#d97706" },
            { key: "c", label: "Canceladas", color: STATUS_COLORS.c },
          ]}
          values={monthValues}
        />
      </ChartCard>

      <ChartCard
        title="Totales por naviera"
        description="Reservas activas (sin canceladas) por marca."
        accent="#3478b5"
      >
        <HorizontalBarChart
          accent="#3478b5"
          items={stats.by_shipping_line.map((row) => ({
            label: row.name,
            value: row.bookings,
            hint:
              row.planned_pax && row.planned_pax > 0
                ? `· ${row.planned_pax.toLocaleString("es")} pax`
                : undefined,
          }))}
        />
      </ChartCard>

      <ChartCard
        title="Barcos principales"
        description="Flota con más escalas en el período."
        accent="#7c3aed"
      >
        <HorizontalBarChart
          accent="#7c3aed"
          items={stats.top_vessels.map((row) => ({
            label: row.name,
            value: row.bookings,
            hint: `· ${row.shipping_line_name}`,
          }))}
        />
      </ChartCard>

      <ChartCard
        title="Escalas por puerto"
        description="Concentración operativa entre puertos."
        accent="#0d9488"
      >
        <HorizontalBarChart
          accent="#0d9488"
          items={stats.by_port.map((row) => ({
            label: row.name,
            value: row.bookings,
          }))}
        />
      </ChartCard>

      <ChartCard
        title="Carga por día de la semana"
        description="Qué días concentran más escalas activas."
        accent="#0891b2"
      >
        <HorizontalBarChart
          accent="#0891b2"
          items={stats.by_weekday.map((row) => ({
            label: row.label,
            value: row.count,
          }))}
        />
      </ChartCard>

      {stats.by_cancellation_reason.length > 0 ? (
        <ChartCard
          title="Motivos de cancelación"
          description="Desglose de cancelaciones registradas."
          className="lg:col-span-2"
          accent="#dc2626"
        >
          <HorizontalBarChart
            accent="#dc2626"
            valueSuffix="cancelaciones"
            items={stats.by_cancellation_reason.map((row) => ({
              label: row.label,
              value: row.count,
            }))}
          />
        </ChartCard>
      ) : null}
    </div>
  );
}
