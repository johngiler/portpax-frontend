"use client";

import type { DashboardStats } from "@/types/dashboard";
import ChartCard from "./charts/ChartCard";
import DonutChart from "./charts/DonutChart";
import HorizontalBarChart from "./charts/HorizontalBarChart";
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

const STATUS_COLORS = {
  requested: "#d97706",
  confirmed: "#3478b5",
  cancelled: "#dc2626",
};

type DashboardChartsProps = {
  stats: DashboardStats;
};

export default function DashboardCharts({ stats }: DashboardChartsProps) {
  const monthCategories = MONTH_LABELS;
  const monthValues: Record<string, Record<string, number>> = {};
  for (const row of stats.by_month) {
    const label = MONTH_LABELS[row.month - 1];
    monthValues[label] = {
      requested: row.requested,
      confirmed: row.confirmed,
      cancelled: row.cancelled,
    };
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ChartCard
        title="Solicitadas vs confirmadas"
        description="Distribución de estados en el período filtrado."
        accent="#3478b5"
      >
        <DonutChart
          centerLabel="Total"
          centerValue={stats.kpis.total_bookings}
          slices={stats.status_breakdown.map((slice) => ({
            key: slice.status,
            label: slice.label,
            value: slice.count,
            color:
              STATUS_COLORS[slice.status as keyof typeof STATUS_COLORS] ??
              "#71717a",
          }))}
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
            { key: "confirmed", label: "Confirmadas", color: STATUS_COLORS.confirmed },
            { key: "requested", label: "Solicitadas", color: STATUS_COLORS.requested },
            { key: "cancelled", label: "Canceladas", color: STATUS_COLORS.cancelled },
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
