"use client";

import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import type { DockingStats, Scale, ScalesByMonth, ScalesByYear } from "@/lib/docking";
import { getDockingStats, getScales, getScalesByMonth, getScalesByYear } from "@/lib/docking";
import DashboardChartsSkeleton from "@/sections/admin/DashboardChartsSkeleton";

const COLOR_ESCALAS = "#3478b5";
const COLOR_PAX = "#0d9488";
const COLOR_ESCALAS_YEAR = "#7c3aed";
const COLOR_PAX_YEAR = "#d97706";

const PIE_COLORS = ["#3478b5", "#0d9488", "#d97706", "#7c3aed", "#059669", "#dc2626", "#64748b"];

function aggregateScalesByPort(scales: Scale[]) {
  const byPort = new Map<string, { count: number; pax: number }>();
  for (const s of scales) {
    const name = s.port_name || "Sin puerto";
    const cur = byPort.get(name) ?? { count: 0, pax: 0 };
    cur.count += 1;
    cur.pax += s.pax_count ?? 0;
    byPort.set(name, cur);
  }
  const sorted = [...byPort.entries()]
    .map(([name, v]) => ({ name, scales: v.count, pax: v.pax }))
    .sort((a, b) => b.scales - a.scales);
  const top6 = sorted.slice(0, 6);
  const rest = sorted.slice(6);
  if (rest.length === 0) return top6.map((r) => ({ name: r.name, value: r.scales, pax: r.pax }));
  return [
    ...top6.map((r) => ({ name: r.name, value: r.scales, pax: r.pax })),
    { name: "Otros", value: rest.reduce((s, r) => s + r.scales, 0), pax: rest.reduce((s, r) => s + r.pax, 0) },
  ];
}

import type { DashboardVisibility } from "@/types/dashboard";
import { DEFAULT_DASHBOARD_VISIBILITY } from "@/types/dashboard";

type DashboardChartsSectionProps = {
  visibility?: Partial<DashboardVisibility>;
};

export default function DashboardChartsSection({
  visibility: visibilityProp,
}: DashboardChartsSectionProps = {}) {
  const visibility = { ...DEFAULT_DASHBOARD_VISIBILITY, ...visibilityProp };
  const [data, setData] = useState<ScalesByMonth[]>([]);
  const [dataByYear, setDataByYear] = useState<ScalesByYear[]>([]);
  const [stats, setStats] = useState<DockingStats | null>(null);
  const [scales, setScales] = useState<Scale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getScalesByMonth(), getScalesByYear(), getDockingStats(), getScales()])
      .then(([byMonth, byYear, s, sc]) => {
        setData(byMonth);
        setDataByYear(byYear);
        setStats(s);
        setScales(sc);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  const catalogPieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Barcos", value: stats.ships },
      { name: "Muelles", value: stats.berths },
      { name: "Puertos", value: stats.ports },
      { name: "Navieras", value: stats.shipping_lines },
    ].filter((d) => d.value > 0);
  }, [stats]);

  const scalesByPortPie = useMemo(() => aggregateScalesByPort(scales), [scales]);
  const paxByPortPie = useMemo(() => {
    const byPort = aggregateScalesByPort(scales);
    return byPort.map((d) => ({ name: d.name, value: d.pax })).filter((d) => d.value > 0);
  }, [scales]);

  const kpiSummaryData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const monthLabel = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
    const thisMonth = data.find((d) => d.month_label === monthLabel);
    const thisYear = dataByYear.find((d) => d.year === currentYear);
    const totalScales = scales.length;
    const totalPax = scales.reduce((s, sc) => s + (sc.pax_count ?? 0), 0);
    const avgScalesPerMonth = data.length ? Math.round(data.reduce((a, d) => a + d.scales, 0) / data.length) : 0;
    const rows: { period: string; escalas: number; pax: number }[] = [];
    if (thisMonth) rows.push({ period: "Este mes", escalas: thisMonth.scales, pax: thisMonth.pax_total });
    if (thisYear) rows.push({ period: "Este año", escalas: thisYear.scales, pax: thisYear.pax_total });
    if (totalScales > 0 || totalPax > 0) rows.push({ period: "Histórico", escalas: totalScales, pax: totalPax });
    if (data.length > 0 && avgScalesPerMonth > 0) rows.push({ period: "Prom. mes", escalas: avgScalesPerMonth, pax: 0 });
    return rows;
  }, [data, dataByYear, scales]);

  const hasAnyKpi = kpiSummaryData.length > 0;

  if (loading) {
    return <DashboardChartsSkeleton />;
  }

  if (error) {
    return (
      <div className="mt-8 rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/80">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{`Error: ${error}`}</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      <div className="min-w-0 space-y-8">
      {/* Resumen de métricas: gráfica lineal en lugar de tarjetas */}
      {visibility.resumenMetricas && hasAnyKpi && kpiSummaryData.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Resumen de métricas
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={kpiSummaryData} margin={{ top: 5, right: 50, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.7 }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.7 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.7 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid var(--admin-accent)",
                    background: "var(--background)",
                  }}
                  labelStyle={{ color: "var(--foreground)" }}
                  formatter={(value: unknown, name?: unknown) => [
                    String(name) === "pax_total" ? Number(value ?? 0).toLocaleString("es") : Number(value ?? 0),
                    String(name) === "pax_total" ? "PAX" : "Escalas",
                  ]}
                  labelFormatter={(label) => String(label)}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="escalas"
                  stroke={COLOR_ESCALAS}
                  strokeWidth={2}
                  dot={{ fill: COLOR_ESCALAS, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="escalas"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="pax"
                  stroke={COLOR_PAX}
                  strokeWidth={2}
                  dot={{ fill: COLOR_PAX, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="pax_total"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Gráficas de pastel: 2 columnas, la última si es impar ocupa toda la fila */}
      {(() => {
        const pieCharts = [
          visibility.distribucionCatalogo && catalogPieData.length > 0 && "catalog",
          visibility.escalasPorPuerto && scalesByPortPie.length > 0 && "scalesPort",
          visibility.paxPorPuerto && paxByPortPie.length > 0 && "paxPort",
        ].filter(Boolean) as string[];
        const pieCount = pieCharts.length;
        return (
          <div className="grid gap-6 lg:grid-cols-2">
            {visibility.distribucionCatalogo && catalogPieData.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Distribución del catálogo
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={catalogPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {catalogPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid var(--admin-accent)", background: "var(--background)" }}
                    formatter={(value: unknown) => [Number(value ?? 0), "Cantidad"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {visibility.escalasPorPuerto && scalesByPortPie.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Escalas por puerto
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scalesByPortPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {scalesByPortPie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid var(--admin-accent)", background: "var(--background)" }}
                    formatter={(value: unknown) => [Number(value ?? 0), "Escalas"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {visibility.paxPorPuerto && paxByPortPie.length > 0 && (
          <div className={`overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80 ${pieCount === 3 ? "lg:col-span-2" : ""}`}>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              PAX por puerto
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paxByPortPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, value }) => `${name}: ${Number(value).toLocaleString("es")}`}
                  >
                    {paxByPortPie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid var(--admin-accent)", background: "var(--background)" }}
                    formatter={(value: unknown) => [Number(value ?? 0).toLocaleString("es"), "PAX"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
          </div>
        );
      })()}

      {/* Gráficas de líneas: 2 columnas, la de año ocupa toda la fila */}
      {(visibility.escalasPorMes || visibility.paxPorMes || visibility.escalasPaxPorAno) && data.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
      {visibility.escalasPorMes && (
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Escalas por mes
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
              <XAxis
                dataKey="month_label"
                tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.7 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.7 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--admin-accent)",
                  background: "var(--background)",
                }}
                labelStyle={{ color: "var(--foreground)" }}
                formatter={(value: unknown) => [Number(value ?? 0), "Escalas"]}
                labelFormatter={(label) => `Mes: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="scales"
                stroke={COLOR_ESCALAS}
                strokeWidth={2}
                dot={{ fill: COLOR_ESCALAS, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}

      {visibility.paxPorMes && (
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          PAX total por mes
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
              <XAxis
                dataKey="month_label"
                tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.7 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.7 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--admin-accent)",
                  background: "var(--background)",
                }}
                labelStyle={{ color: "var(--foreground)" }}
                formatter={(value: unknown) => [Number(value ?? 0).toLocaleString("es"), "PAX"]}
                labelFormatter={(label) => `Mes: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="pax_total"
                stroke={COLOR_PAX}
                strokeWidth={2}
                dot={{ fill: COLOR_PAX, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}

      {visibility.escalasPaxPorAno && dataByYear.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Escalas y PAX por año
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataByYear} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.7 }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.7 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.7 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid var(--admin-accent)",
                    background: "var(--background)",
                  }}
                  labelStyle={{ color: "var(--foreground)" }}
                  formatter={(value: unknown, name?: unknown) => [
                    String(name) === "pax_total" ? Number(value ?? 0).toLocaleString("es") : Number(value ?? 0),
                    String(name) === "pax_total" ? "PAX" : "Escalas",
                  ]}
                  labelFormatter={(label) => `Año ${label}`}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="scales"
                  stroke={COLOR_ESCALAS_YEAR}
                  strokeWidth={2}
                  dot={{ fill: COLOR_ESCALAS_YEAR, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="scales"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="pax_total"
                  stroke={COLOR_PAX_YEAR}
                  strokeWidth={2}
                  dot={{ fill: COLOR_PAX_YEAR, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="pax_total"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
        </div>
      )}
      </div>
    </div>
  );
}
