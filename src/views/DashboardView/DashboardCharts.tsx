"use client";

import { useState } from "react";
import { ChartLine, Table2 } from "lucide-react";
import type { BookingStatusFilterValue } from "@/types/booking";
import { isBookingStatusFilterValue } from "@/types/booking";
import type { DashboardStats } from "@/types/dashboard";
import ChartCard from "./charts/ChartCard";
import DonutChart from "./charts/DonutChart";
import HorizontalBarChart from "./charts/HorizontalBarChart";
import PortMonthComboChart from "./charts/PortMonthComboChart";
import {
  dashboardBookingsHref,
  type DashboardBookingsLinkBase,
} from "./dashboardBookingsHref";

const STATUS_COLORS: Record<string, string> = {
  h: "#f59e0b",
  co: "#3478b5",
  cl: "#1d4ed8",
  lta: "#06b6d4",
  r: "#16a34a",
  c: "#7f1d1d",
};

type DashboardChartsProps = {
  stats: DashboardStats;
  linkBase: DashboardBookingsLinkBase;
};

export default function DashboardCharts({
  stats,
  linkBase,
}: DashboardChartsProps) {
  const [portMonthMode, setPortMonthMode] = useState<"chart" | "table">("chart");

  const statusSlices = stats.status_breakdown.map((slice) => {
    const status = isBookingStatusFilterValue(slice.status)
      ? ([slice.status] as BookingStatusFilterValue[])
      : undefined;
    return {
      key: slice.status,
      label: slice.label,
      value: slice.count,
      color: STATUS_COLORS[slice.status] ?? "#71717a",
      href: status
        ? dashboardBookingsHref(linkBase, { status })
        : dashboardBookingsHref(linkBase),
    };
  });
  const statusTotal = statusSlices.reduce((sum, s) => sum + s.value, 0);
  const statusTotalHref = dashboardBookingsHref(linkBase);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ChartCard
        title="Pasajeros por mes y puerto"
        description="Líneas = pax (eje izq.) · barras = calls (eje der.)."
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
          centerHref={statusTotalHref}
          slices={statusSlices}
        />
      </ChartCard>

      <ChartCard
        title="Barcos principales"
        description="Ordenado por pax planificados · calls por barco."
        accent="#7c3aed"
      >
        <HorizontalBarChart
          accent="#7c3aed"
          valueSuffix="pax"
          items={stats.top_vessels.map((row) => ({
            label: row.name,
            value: row.planned_pax,
            hint: [
              row.shipping_line_name,
              `${row.bookings.toLocaleString("es")} calls`,
            ]
              .filter(Boolean)
              .join(" · "),
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
        description="Calls activos · días con escala vs días del período."
        accent="#0891b2"
      >
        <HorizontalBarChart
          accent="#0891b2"
          valueSuffix="calls"
          items={stats.by_weekday.map((row) => {
            const inPeriod = row.days_in_period ?? 0;
            const used = row.days_used ?? 0;
            return {
              label: row.label,
              value: row.count,
              hint:
                inPeriod > 0
                  ? `${used.toLocaleString("es")}/${inPeriod.toLocaleString("es")} días`
                  : undefined,
            };
          })}
        />
      </ChartCard>

      {stats.by_cancellation_reason.length > 0 ? (
        <ChartCard
          title="Motivos de cancelación"
          description="Desglose con puerto, naviera y pax planificados."
          className="lg:col-span-2"
          accent="#dc2626"
        >
          <HorizontalBarChart
            accent="#dc2626"
            valueSuffix="cancelaciones"
            items={stats.by_cancellation_reason.map((row) => ({
              label: row.label,
              value: row.count,
              hint: [
                row.port_name,
                row.shipping_line_name,
                row.planned_pax != null && row.planned_pax > 0
                  ? `${row.planned_pax.toLocaleString("es")} pax`
                  : null,
              ]
                .filter(Boolean)
                .join(" · "),
            }))}
          />
        </ChartCard>
      ) : null}

      <ChartCard
        title="Totales por naviera"
        description="Ordenado por pax planificados · promedio por escala."
        accent="#3478b5"
        className="lg:col-span-2"
      >
        <HorizontalBarChart
          accent="#3478b5"
          valueSuffix="pax"
          items={stats.by_shipping_line.map((row) => ({
            label: row.name,
            value: row.planned_pax ?? 0,
            hint: [
              `${row.bookings.toLocaleString("es")} calls`,
              row.avg_planned_pax != null && row.avg_planned_pax > 0
                ? `prom. ${row.avg_planned_pax.toLocaleString("es")} pax`
                : null,
            ]
              .filter(Boolean)
              .join(" · "),
          }))}
        />
      </ChartCard>
    </div>
  );
}
