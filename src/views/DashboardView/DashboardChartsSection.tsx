"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import type {
  BerthTimeline,
  OperationsAlerts,
  RevenueEstimate,
  Scale,
  ScalesByMonth,
  ScalesByYear,
} from "@/lib/docking";
import {
  getBerthTimeline,
  getOperationsAlerts,
  getRevenueEstimate,
  getScales,
  getScalesByMonth,
  getScalesByYear,
} from "@/lib/docking";
import type { TimeRange } from "@/lib/timeRange";
import DashboardChartsSkeleton from "./DashboardChartsSkeleton";
import type { DashboardVisibility } from "@/types/dashboard";
import { DEFAULT_DASHBOARD_VISIBILITY } from "@/types/dashboard";

/** Paleta para barras (escalas por muelle) y acentos */
const CHART_PALETTE = [
  "#3478b5",
  "#0d9488",
  "#6366f1",
  "#d97706",
  "#059669",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#ca8a04",
  "#db2777",
];

/** Paleta pastel para gráficas de pastel (puerto, PAX, naviera) */
const PASTEL_PALETTE = [
  "#7eb4e8",
  "#6ecfc6",
  "#9b8dd4",
  "#e8c04a",
  "#5eb8a8",
  "#e8928a",
  "#b39ddb",
  "#67d4e0",
  "#c5a86c",
  "#d492b8",
];

const COLOR_ESCALAS = "#3478b5";
const COLOR_PAX = "#0d9488";
const COLOR_ESCALAS_YEAR = "#6366f1";
const COLOR_PAX_YEAR = "#d97706";

function aggregateScalesByPort(scales: Scale[]) {
  const byPort = new Map<string, { count: number; pax: number }>();
  for (const s of scales) {
    const name = s.port_name || "Sin puerto";
    const cur = byPort.get(name) ?? { count: 0, pax: 0 };
    cur.count += 1;
    cur.pax += s.pax_count ?? 0;
    byPort.set(name, cur);
  }
  return [...byPort.entries()]
    .map(([name, v]) => ({ name, escalas: v.count, pax: v.pax }))
    .sort((a, b) => b.escalas - a.escalas)
    .slice(0, 8);
}

function aggregateScalesByShippingLine(scales: Scale[]) {
  const byLine = new Map<string, { count: number; pax: number }>();
  for (const s of scales) {
    const name = s.shipping_line_name || "Sin naviera";
    const cur = byLine.get(name) ?? { count: 0, pax: 0 };
    cur.count += 1;
    cur.pax += s.pax_count ?? 0;
    byLine.set(name, cur);
  }
  return [...byLine.entries()]
    .map(([name, v]) => ({ name, escalas: v.count, pax: v.pax }))
    .sort((a, b) => b.escalas - a.escalas)
    .slice(0, 8);
}

function aggregateScalesByBerth(scales: Scale[]) {
  const byBerth = new Map<string, { count: number; pax: number }>();
  for (const s of scales) {
    const port = s.port_name || "Sin puerto";
    const berth = s.berth_name || "Sin muelle";
    const name = `${port} · ${berth}`;
    const cur = byBerth.get(name) ?? { count: 0, pax: 0 };
    cur.count += 1;
    cur.pax += s.pax_count ?? 0;
    byBerth.set(name, cur);
  }
  return [...byBerth.entries()]
    .map(([name, v]) => ({ name, escalas: v.count, pax: v.pax }))
    .sort((a, b) => b.escalas - a.escalas)
    .slice(0, 12);
}

function formatDate(s: string) {
  try {
    const d = new Date(s);
    return d.toLocaleDateString("es", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

/** Estilos unificados para todos los tooltips de gráficas: diseño refinado y fuente más pequeña */
const tooltipContentStyle = {
  borderRadius: "8px",
  border: "1px solid var(--admin-accent)",
  background: "var(--background)",
  boxShadow: "var(--admin-card-shadow)",
  padding: "8px 12px",
  fontSize: "11px",
  lineHeight: 1.4,
};
const tooltipLabelStyle = { fontSize: "11px", fontWeight: 600 };
const tooltipItemStyle = { fontSize: "11px" };

/** Leyenda en columna para pastel: punto de color + nombre + % */
function PieLegendColumn({
  data,
  palette,
}: {
  data: { name: string; value: number }[];
  palette: string[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col justify-center gap-1.5 overflow-hidden">
      {data.map((d, i) => {
        const pct = total > 0 ? (d.value / total) * 100 : 0;
        return (
          <div key={d.name} className="flex items-center gap-2 min-w-0">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: palette[i % palette.length] }}
              aria-hidden
            />
            <span className="min-w-0 truncate text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {d.name}
            </span>
            <span className="shrink-0 text-[10px] font-semibold tabular-nums text-zinc-500 dark:text-zinc-400">
              {pct.toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

type DashboardChartsSectionProps = {
  visibility?: Partial<DashboardVisibility>;
  timeRange: TimeRange;
};

const cardClass =
  "overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80";
const cardTitleClass =
  "mb-4 pb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700";
/** Gradientes sutiles para cards (mismo criterio que las de pastel) */
const CARD_GRADIENT_BLUE =
  "linear-gradient(160deg, rgba(126, 180, 232, 0.14) 0%, var(--background) 55%)";
const CARD_GRADIENT_TEAL =
  "linear-gradient(160deg, rgba(110, 207, 198, 0.14) 0%, var(--background) 55%)";
const CARD_GRADIENT_VIOLET =
  "linear-gradient(160deg, rgba(155, 141, 212, 0.14) 0%, var(--background) 55%)";
const CARD_GRADIENT_AMBER =
  "linear-gradient(160deg, rgba(217, 119, 6, 0.1) 0%, var(--background) 55%)";
const CARD_GRADIENT_EMERALD =
  "linear-gradient(160deg, rgba(5, 150, 105, 0.12) 0%, var(--background) 55%)";

export default function DashboardChartsSection({
  visibility: visibilityProp,
  timeRange,
}: DashboardChartsSectionProps) {
  const visibility = { ...DEFAULT_DASHBOARD_VISIBILITY, ...visibilityProp };
  const [data, setData] = useState<ScalesByMonth[]>([]);
  const [dataByYear, setDataByYear] = useState<ScalesByYear[]>([]);
  const [scales, setScales] = useState<Scale[]>([]);
  const [revenue, setRevenue] = useState<RevenueEstimate | null>(null);
  const [berthTimeline, setBerthTimeline] = useState<BerthTimeline | null>(null);
  const [operationsAlerts, setOperationsAlerts] = useState<OperationsAlerts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getScalesByMonth(),
      getScalesByYear(),
      getScales({
        page_size: 500,
        date_after: timeRange.date_from,
        date_before: timeRange.date_to,
      }),
      getRevenueEstimate().catch(() => null),
      getBerthTimeline({
        date_from: timeRange.date_from,
        date_to: timeRange.date_to,
      }).catch(() => null),
      getOperationsAlerts({ date: timeRange.date_to }).catch(() => null),
    ])
      .then(([byMonth, byYear, sc, rev, timeline, alerts]) => {
        setData(byMonth);
        setDataByYear(byYear);
        setScales(sc.results);
        setRevenue(rev ?? null);
        setBerthTimeline(timeline ?? null);
        setOperationsAlerts(alerts ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [timeRange.date_from, timeRange.date_to]);

  const scalesByPort = useMemo(() => aggregateScalesByPort(scales), [scales]);
  const scalesByNaviera = useMemo(
    () => aggregateScalesByShippingLine(scales),
    [scales],
  );
  const scalesByBerth = useMemo(() => aggregateScalesByBerth(scales), [scales]);

  const nextScales = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [...scales]
      .filter((s) => s.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 12);
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
    const avgScalesPerMonth = data.length
      ? Math.round(data.reduce((a, d) => a + d.scales, 0) / data.length)
      : 0;
    const rows: { period: string; escalas: number; pax: number }[] = [];
    if (thisMonth)
      rows.push({
        period: "Este mes",
        escalas: thisMonth.scales,
        pax: thisMonth.pax_total,
      });
    if (thisYear)
      rows.push({
        period: "Este año",
        escalas: thisYear.scales,
        pax: thisYear.pax_total,
      });
    if (totalScales > 0 || totalPax > 0)
      rows.push({ period: "Histórico", escalas: totalScales, pax: totalPax });
    if (data.length > 0 && avgScalesPerMonth > 0)
      rows.push({ period: "Prom. mes", escalas: avgScalesPerMonth, pax: 0 });
    return rows;
  }, [data, dataByYear, scales]);

  const hasAnyKpi = kpiSummaryData.length > 0;

  if (loading) {
    return <DashboardChartsSkeleton />;
  }

  if (error) {
    return (
      <div
        className={`mt-8 p-6 ${cardClass}`}
        style={{ background: CARD_GRADIENT_BLUE }}
      >
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{`Error: ${error}`}</p>
      </div>
    );
  }

  const formatTimelineDate = (d: string) => {
    try {
      return new Date(d + "T12:00:00").toLocaleDateString("es", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="mt-8 space-y-8">
      <div className="min-w-0 space-y-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {visibility.escalasPorPuerto && scalesByPort.length > 0 && (
            <div
              className={`flex min-h-[240px] flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80`}
              style={{
                background:
                  "linear-gradient(160deg, rgba(126, 180, 232, 0.14) 0%, var(--background) 55%)",
              }}
            >
              <h3
                className={`${cardTitleClass} border-b border-[rgba(126,180,232,0.5)] pb-3 dark:border-[rgba(126,180,232,0.35)]`}
              >
                Escalas por puerto
              </h3>
              <div className="flex min-h-0 flex-1 gap-4">
                <div className="w-[52%] shrink-0">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={scalesByPort.map((d) => ({
                          name: d.name,
                          value: d.escalas,
                        }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={62}
                        innerRadius={26}
                        paddingAngle={2}
                        stroke="var(--background)"
                        strokeWidth={1.5}
                      >
                        {scalesByPort.map((_, i) => (
                          <Cell
                            key={i}
                            fill={PASTEL_PALETTE[i % PASTEL_PALETTE.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipContentStyle}
                        labelStyle={tooltipLabelStyle}
                        itemStyle={tooltipItemStyle}
                        formatter={(v: unknown) => [
                          Number(v ?? 0).toLocaleString("es"),
                          "Escalas",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="min-w-0 flex-1 py-2">
                  <PieLegendColumn
                    data={scalesByPort.map((d) => ({
                      name: d.name,
                      value: d.escalas,
                    }))}
                    palette={PASTEL_PALETTE}
                  />
                </div>
              </div>
            </div>
          )}

          {visibility.paxPorPuerto && scalesByPort.length > 0 && (
            <div
              className={`flex min-h-[240px] flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80`}
              style={{
                background:
                  "linear-gradient(160deg, rgba(110, 207, 198, 0.14) 0%, var(--background) 55%)",
              }}
            >
              <h3
                className={`${cardTitleClass} border-b border-[rgba(110,207,198,0.5)] pb-3 dark:border-[rgba(110,207,198,0.35)]`}
              >
                PAX por puerto
              </h3>
              <div className="flex min-h-0 flex-1 gap-4">
                <div className="w-[52%] shrink-0">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[...scalesByPort]
                          .sort((a, b) => b.pax - a.pax)
                          .map((d) => ({ name: d.name, value: d.pax }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={62}
                        innerRadius={26}
                        paddingAngle={2}
                        stroke="var(--background)"
                        strokeWidth={1.5}
                      >
                        {scalesByPort.map((_, i) => (
                          <Cell
                            key={i}
                            fill={PASTEL_PALETTE[i % PASTEL_PALETTE.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipContentStyle}
                        labelStyle={tooltipLabelStyle}
                        itemStyle={tooltipItemStyle}
                        formatter={(v: unknown) => [
                          Number(v ?? 0).toLocaleString("es"),
                          "PAX",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="min-w-0 flex-1 py-2">
                  <PieLegendColumn
                    data={[...scalesByPort]
                      .sort((a, b) => b.pax - a.pax)
                      .map((d) => ({ name: d.name, value: d.pax }))}
                    palette={PASTEL_PALETTE}
                  />
                </div>
              </div>
            </div>
          )}

          {visibility.escalasPorNaviera && scalesByNaviera.length > 0 && (
            <div
              className={`flex min-h-[240px] flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80`}
              style={{
                background:
                  "linear-gradient(160deg, rgba(155, 141, 212, 0.14) 0%, var(--background) 55%)",
              }}
            >
              <h3
                className={`${cardTitleClass} border-b border-[rgba(155,141,212,0.5)] pb-3 dark:border-[rgba(155,141,212,0.35)]`}
              >
                Escalas por naviera
              </h3>
              <div className="flex min-h-0 flex-1 gap-4">
                <div className="w-[52%] shrink-0">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={scalesByNaviera.map((d) => ({
                          name: d.name,
                          value: d.escalas,
                        }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={62}
                        innerRadius={26}
                        paddingAngle={2}
                        stroke="var(--background)"
                        strokeWidth={1.5}
                      >
                        {scalesByNaviera.map((_, i) => (
                          <Cell
                            key={i}
                            fill={PASTEL_PALETTE[i % PASTEL_PALETTE.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipContentStyle}
                        labelStyle={tooltipLabelStyle}
                        itemStyle={tooltipItemStyle}
                        formatter={(v: unknown) => [
                          Number(v ?? 0).toLocaleString("es"),
                          "Escalas",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="min-w-0 flex-1 py-2">
                  <PieLegendColumn
                    data={scalesByNaviera.map((d) => ({
                      name: d.name,
                      value: d.escalas,
                    }))}
                    palette={PASTEL_PALETTE}
                  />
                </div>
              </div>
            </div>
          )}

          {visibility.escalasPorMuelle && scalesByBerth.length > 0 && (
            <div
              className={`p-4 ${cardClass} lg:col-span-3`}
              style={{ background: CARD_GRADIENT_AMBER }}
            >
              <h3 className={cardTitleClass}>Escalas por muelle</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={scalesByBerth}
                    margin={{ top: 8, right: 8, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--admin-border)"
                      opacity={0.6}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: 11,
                        fill: "var(--foreground)",
                        opacity: 0.8,
                      }}
                      tickLine={false}
                      axisLine={false}
                      angle={-35}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis
                      tick={{
                        fontSize: 11,
                        fill: "var(--foreground)",
                        opacity: 0.8,
                      }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={tooltipContentStyle}
                      labelStyle={tooltipLabelStyle}
                      itemStyle={tooltipItemStyle}
                      formatter={(value: unknown) => [
                        Number(value ?? 0).toLocaleString("es"),
                        "Escalas",
                      ]}
                      labelFormatter={(label) => `Muelle: ${label}`}
                    />
                    <Bar dataKey="escalas" radius={[6, 6, 0, 0]} name="Escalas">
                      {scalesByBerth.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_PALETTE[i % CHART_PALETTE.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Gráficas de tendencia: área con gradiente, estilo moderno */}
        {(visibility.escalasPorMes ||
          visibility.paxPorMes ||
          visibility.escalasPaxPorAno) &&
          data.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              {visibility.escalasPorMes && (
                <div
                  className={`p-4 ${cardClass}`}
                  style={{ background: CARD_GRADIENT_BLUE }}
                >
                  <h3 className={cardTitleClass}>Escalas por mes</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={data}
                        margin={{ top: 8, right: 8, left: 0, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient
                            id="gradEscalas"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor={COLOR_ESCALAS}
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="100%"
                              stopColor={COLOR_ESCALAS}
                              stopOpacity={0.05}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--admin-border)"
                          opacity={0.6}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="month_label"
                          tick={{
                            fontSize: 11,
                            fill: "var(--foreground)",
                            opacity: 0.8,
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{
                            fontSize: 11,
                            fill: "var(--foreground)",
                            opacity: 0.8,
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={tooltipContentStyle}
                          labelStyle={tooltipLabelStyle}
                          itemStyle={tooltipItemStyle}
                          formatter={(value: unknown) => [
                            Number(value ?? 0),
                            "Escalas",
                          ]}
                          labelFormatter={(label) => `Mes: ${label}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="scales"
                          stroke={COLOR_ESCALAS}
                          strokeWidth={2.5}
                          fill="url(#gradEscalas)"
                          dot={{ fill: COLOR_ESCALAS, r: 3, strokeWidth: 0 }}
                          activeDot={{
                            r: 5,
                            fill: COLOR_ESCALAS,
                            stroke: "var(--background)",
                            strokeWidth: 2,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {visibility.paxPorMes && (
                <div
                  className={`p-4 ${cardClass}`}
                  style={{ background: CARD_GRADIENT_TEAL }}
                >
                  <h3 className={cardTitleClass}>PAX total por mes</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={data}
                        margin={{ top: 8, right: 8, left: 0, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient
                            id="gradPax"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor={COLOR_PAX}
                              stopOpacity={0.45}
                            />
                            <stop
                              offset="100%"
                              stopColor={COLOR_PAX}
                              stopOpacity={0.06}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--admin-border)"
                          opacity={0.6}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="month_label"
                          tick={{
                            fontSize: 11,
                            fill: "var(--foreground)",
                            opacity: 0.8,
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{
                            fontSize: 11,
                            fill: "var(--foreground)",
                            opacity: 0.8,
                          }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) =>
                            v >= 1000 ? `${v / 1000}k` : String(v)
                          }
                        />
                        <Tooltip
                          contentStyle={tooltipContentStyle}
                          labelStyle={tooltipLabelStyle}
                          itemStyle={tooltipItemStyle}
                          formatter={(value: unknown) => [
                            Number(value ?? 0).toLocaleString("es"),
                            "PAX",
                          ]}
                          labelFormatter={(label) => `Mes: ${label}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="pax_total"
                          stroke={COLOR_PAX}
                          strokeWidth={2.5}
                          fill="url(#gradPax)"
                          dot={{ fill: COLOR_PAX, r: 3, strokeWidth: 0 }}
                          activeDot={{
                            r: 5,
                            fill: COLOR_PAX,
                            stroke: "var(--background)",
                            strokeWidth: 2,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {visibility.escalasPaxPorAno && dataByYear.length > 0 && (
                <div
                  className={`p-4 ${cardClass} lg:col-span-2`}
                  style={{ background: CARD_GRADIENT_EMERALD }}
                >
                  <h3 className={cardTitleClass}>Escalas y PAX por año</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={dataByYear}
                        margin={{ top: 8, right: 8, left: 0, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient
                            id="gradEscalasYear"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor={COLOR_ESCALAS_YEAR}
                              stopOpacity={0.35}
                            />
                            <stop
                              offset="100%"
                              stopColor={COLOR_ESCALAS_YEAR}
                              stopOpacity={0.04}
                            />
                          </linearGradient>
                          <linearGradient
                            id="gradPaxYear"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor={COLOR_PAX_YEAR}
                              stopOpacity={0.35}
                            />
                            <stop
                              offset="100%"
                              stopColor={COLOR_PAX_YEAR}
                              stopOpacity={0.04}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--admin-border)"
                          opacity={0.6}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="year"
                          tick={{
                            fontSize: 11,
                            fill: "var(--foreground)",
                            opacity: 0.8,
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{
                            fontSize: 11,
                            fill: "var(--foreground)",
                            opacity: 0.8,
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{
                            fontSize: 11,
                            fill: "var(--foreground)",
                            opacity: 0.8,
                          }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) =>
                            v >= 1000 ? `${v / 1000}k` : String(v)
                          }
                        />
                        <Tooltip
                          contentStyle={tooltipContentStyle}
                          labelStyle={tooltipLabelStyle}
                          itemStyle={tooltipItemStyle}
                          formatter={(value: unknown, name?: unknown) => [
                            String(name) === "pax_total"
                              ? Number(value ?? 0).toLocaleString("es")
                              : Number(value ?? 0),
                            String(name) === "pax_total" ? "PAX" : "Escalas",
                          ]}
                          labelFormatter={(label) => `Año ${label}`}
                        />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="scales"
                          stroke={COLOR_ESCALAS_YEAR}
                          strokeWidth={2.5}
                          fill="url(#gradEscalasYear)"
                          dot={{
                            fill: COLOR_ESCALAS_YEAR,
                            r: 4,
                            strokeWidth: 0,
                          }}
                          activeDot={{
                            r: 6,
                            fill: COLOR_ESCALAS_YEAR,
                            stroke: "var(--background)",
                            strokeWidth: 2,
                          }}
                          name="scales"
                        />
                        <Area
                          yAxisId="right"
                          type="monotone"
                          dataKey="pax_total"
                          stroke={COLOR_PAX_YEAR}
                          strokeWidth={2.5}
                          fill="url(#gradPaxYear)"
                          dot={{ fill: COLOR_PAX_YEAR, r: 4, strokeWidth: 0 }}
                          activeDot={{
                            r: 6,
                            fill: COLOR_PAX_YEAR,
                            stroke: "var(--background)",
                            strokeWidth: 2,
                          }}
                          name="pax_total"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

        {/* Ingresos estimados por muellaje (barras de colores por año) */}
        {(visibility.resumenMetricas || visibility.estimadoIngresos) &&
          revenue &&
          revenue.total_estimated_revenue_usd > 0 &&
          revenue.by_year.length > 0 && (
            <div
              className={`p-4 ${cardClass}`}
              style={{ background: CARD_GRADIENT_BLUE }}
            >
              <h3 className={cardTitleClass}>
                Ingresos estimados (muellaje)
              </h3>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Por año (US$)
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={revenue.by_year.slice(-6)}
                  margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--admin-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--admin-border)" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      v >= 1e6
                        ? `${(v / 1e6).toFixed(1)}M`
                        : v >= 1000
                          ? `${(v / 1000).toFixed(0)}k`
                          : String(v)
                    }
                  />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                    formatter={(value: unknown) => [
                      new Intl.NumberFormat("es", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      }).format(Number(value ?? 0)),
                      "Ingresos est.",
                    ]}
                    labelFormatter={(label) => `Año ${label}`}
                  />
                  <Bar
                    dataKey="estimated_revenue_usd"
                    name="Ingresos est."
                    radius={[4, 4, 0, 0]}
                  >
                    {revenue.by_year.slice(-6).map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_PALETTE[i % CHART_PALETTE.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                PAX × tarifa por puerto y tier de naviera. Solo escalas con
                tarifa definida.
              </p>
            </div>
          )}

        {/* Próximas escalas: más datos y diseño de filas mejorado */}
        {visibility.proximasEscalas && (
          <div
            className={`w-full overflow-hidden p-4 ${cardClass}`}
            style={{ background: CARD_GRADIENT_VIOLET }}
          >
            <h3 className={cardTitleClass}>Próximas escalas</h3>
            {nextScales.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No hay escalas programadas a futuro. Carga datos para verlas
                aquí.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      <th className="pb-2 pr-3 pt-0 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Barco
                      </th>
                      <th className="hidden pb-2 pr-3 pt-0 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell dark:text-zinc-400">
                        Puerto · Muelle
                      </th>
                      <th className="hidden pb-2 pr-3 pt-0 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 md:table-cell dark:text-zinc-400">
                        Naviera
                      </th>
                      <th className="pb-2 pr-3 pt-0 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Fecha
                      </th>
                      <th className="pb-2 pr-3 pt-0 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        PAX
                      </th>
                      <th className="hidden pb-2 pr-3 pt-0 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500 lg:table-cell dark:text-zinc-400">
                        Trip.
                      </th>
                      <th className="w-8 pb-2 pl-2 pt-0" aria-hidden />
                    </tr>
                  </thead>
                  <tbody>
                    {nextScales.map((scale) => (
                      <tr
                        key={scale.id}
                        className="border-b border-zinc-100 transition-colors last:border-b-0 hover:bg-zinc-50/80 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                      >
                        <td className="py-3 pr-3">
                          <Link
                            href="/scales"
                            className="cursor-pointer font-medium text-zinc-900 hover:text-[var(--admin-accent)] dark:text-zinc-50 dark:hover:text-[var(--admin-accent)]"
                          >
                            {scale.ship_name}
                          </Link>
                        </td>
                        <td className="hidden py-3 pr-3 text-sm text-zinc-600 dark:text-zinc-400 sm:table-cell">
                          {scale.port_name}
                          {scale.berth_name ? ` · ${scale.berth_name}` : "—"}
                        </td>
                        <td className="hidden py-3 pr-3 text-sm text-zinc-600 dark:text-zinc-400 md:table-cell">
                          {scale.shipping_line_name || "—"}
                        </td>
                        <td className="whitespace-nowrap py-3 pr-3 text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
                          {formatDate(scale.date)}
                        </td>
                        <td className="py-3 pr-3 text-right">
                          {scale.pax_count != null && scale.pax_count > 0 ? (
                            <span className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                              {scale.pax_count.toLocaleString("es")} PAX
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-400">—</span>
                          )}
                        </td>
                        <td className="hidden py-3 pr-3 text-right text-sm tabular-nums text-zinc-500 dark:text-zinc-400 lg:table-cell">
                          {scale.crew_count != null && scale.crew_count > 0
                            ? scale.crew_count.toLocaleString("es")
                            : "—"}
                        </td>
                        <td className="py-3 pl-2">
                          <Link
                            href="/scales"
                            className="inline-flex cursor-pointer items-center justify-center rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-[var(--admin-accent)] dark:hover:bg-zinc-700 dark:hover:text-[var(--admin-accent)]"
                            aria-label="Ver escala"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Link
              href="/scales"
              className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--admin-accent)] transition-opacity hover:opacity-90"
            >
              <CalendarDays className="h-4 w-4" />
              Ver todas las escalas
            </Link>
          </div>
        )}

        {/* Alertas operativas: conflicto de muelle + exceso de pasajeros */}
        {visibility.alertasOperativas && operationsAlerts && (
          <div
            className="w-full overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80"
            style={{ background: CARD_GRADIENT_AMBER }}
          >
            <div className="mb-4 border-b border-zinc-200 pb-4 dark:border-zinc-700">
              <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                Alertas operativas
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {new Date(operationsAlerts.date + "T12:00:00").toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            {operationsAlerts.berth_conflicts.length === 0 &&
            operationsAlerts.passenger_overflows.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No hay alertas para esta fecha.
              </p>
            ) : (
              <div className="space-y-6">
                {operationsAlerts.berth_conflicts.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
                      Conflicto de muelle
                    </h4>
                    <ul className="space-y-2">
                      {operationsAlerts.berth_conflicts.map((c) => (
                        <li
                          key={`${c.berth_id}-${c.date}`}
                          className="flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50/80 px-3 py-2 dark:border-red-900/50 dark:bg-red-950/30"
                        >
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {c.port_name} · {c.berth_name}
                          </span>
                          <span className="text-zinc-500 dark:text-zinc-400">—</span>
                          <span className="text-sm text-red-800 dark:text-red-300">
                            {c.scales.map((s) => s.ship_name).join(", ")}
                          </span>
                          <Link
                            href="/scales"
                            className="ml-auto cursor-pointer text-xs font-medium text-[var(--admin-accent)] hover:underline"
                          >
                            Ver escalas
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {operationsAlerts.passenger_overflows.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      Exceso de pasajeros
                    </h4>
                    <ul className="space-y-2">
                      {operationsAlerts.passenger_overflows.map((o) => (
                        <li
                          key={o.scale_id}
                          className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 dark:border-amber-900/50 dark:bg-amber-950/30"
                        >
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {o.ship_name}
                          </span>
                          <span className="text-zinc-500 dark:text-zinc-400">
                            {o.port_name}
                            {o.berth_name ? ` · ${o.berth_name}` : ""}
                          </span>
                          <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                            {o.pax_count.toLocaleString("es")} PAX &gt; {o.capacity.toLocaleString("es")}{" "}
                            {o.capacity_type === "ship" ? "(cap. barco)" : "(cap. muelle)"}
                          </span>
                          <Link
                            href="/scales"
                            className="ml-auto cursor-pointer text-xs font-medium text-[var(--admin-accent)] hover:underline"
                          >
                            Ver escala
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mapa del puerto: estado de muelles hoy (Dock → barco actual o libre) */}
        {visibility.mapaPuerto && berthTimeline && (
          <div
            className="w-full overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80"
            style={{ background: CARD_GRADIENT_BLUE }}
          >
            <div className="mb-4 border-b border-zinc-200 pb-4 dark:border-zinc-700">
              <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                Mapa del puerto
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Estado de muelles hoy · Ocupado / Libre
              </p>
            </div>
            {berthTimeline.berths.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No hay muelles registrados.
              </p>
            ) : (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {berthTimeline.berths.map((b) => {
                  const todaySlot = b.days[0];
                  const isOccupied = todaySlot && todaySlot.scales.length > 0;
                  const isConflict = todaySlot?.has_conflict ?? false;
                  const shipLabel =
                    isOccupied && todaySlot.scales[0]
                      ? todaySlot.scales[0].ship_name
                      : null;
                  const paxLabel =
                    isOccupied &&
                    todaySlot.scales[0]?.pax_count != null &&
                    todaySlot.scales[0].pax_count > 0
                      ? `${todaySlot.scales[0].pax_count} PAX`
                      : null;
                  return (
                    <div
                      key={b.berth_id}
                      className={`cursor-default rounded-xl border p-4 transition-all duration-200 ${
                        isConflict
                          ? "border-red-300 bg-red-50/80 dark:border-red-900/50 dark:bg-red-950/30"
                          : isOccupied
                            ? "border-[var(--admin-accent)]/40 bg-[var(--admin-accent)]/8 dark:border-[var(--admin-accent)]/30 dark:bg-[var(--admin-accent)]/12"
                            : "border-zinc-200/80 bg-zinc-50/60 dark:border-zinc-700 dark:bg-zinc-800/50"
                      }`}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        {b.port_name}
                      </p>
                      <p className="mt-0.5 font-semibold text-zinc-900 dark:text-zinc-50">
                        {b.berth_name}
                      </p>
                      <div className="mt-3 min-h-[2.5rem]">
                        {isConflict ? (
                          <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-300">
                            Conflicto
                          </span>
                        ) : isOccupied && shipLabel ? (
                          <div className="space-y-1">
                            <p className="truncate text-sm font-medium text-[var(--admin-accent)]">
                              {shipLabel}
                            </p>
                            {paxLabel && (
                              <p className="text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
                                {paxLabel}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
                            Libre
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Timeline / Gantt de muelles — al final, debajo de todas las cards */}
        {visibility.timelineMuelles && berthTimeline && (
          <div
            className="w-full overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80"
            style={{ background: CARD_GRADIENT_TEAL }}
          >
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-700">
              <div>
                <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Timeline de muelles
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Barcos por muelle y día (14 días desde hoy). Detecta conflictos de atraque.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[var(--admin-accent)]/60" aria-hidden />
                  Ocupado
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500/70" aria-hidden />
                  Conflicto
                </span>
                <span className="text-zinc-400 dark:text-zinc-500">— Libre</span>
              </div>
            </div>
            {berthTimeline.berths.length === 0 ? (
              <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No hay muelles con escalas en el rango mostrado.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-700/80">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-zinc-100/80 dark:bg-zinc-800/80">
                      <th className="sticky left-0 z-20 min-w-[160px] border-r border-zinc-200/80 py-3 pl-4 pr-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                        Puerto · Muelle
                      </th>
                      {berthTimeline.dates.map((d) => (
                        <th
                          key={d}
                          className="min-w-[80px] py-3 px-2 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
                        >
                          {formatTimelineDate(d)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {berthTimeline.berths.map((b, rowIdx) => (
                      <tr
                        key={b.berth_id}
                        className={`border-b border-zinc-100/80 transition-colors last:border-b-0 hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:bg-zinc-800/40 ${
                          rowIdx % 2 === 1 ? "bg-zinc-50/30 dark:bg-zinc-800/20" : ""
                        }`}
                      >
                        <td
                          className={`sticky left-0 z-10 min-w-[160px] border-r border-zinc-200/80 py-2.5 pl-4 pr-3 font-medium text-zinc-800 dark:border-zinc-700 dark:text-zinc-200 ${
                            rowIdx % 2 === 1
                              ? "bg-zinc-50/80 dark:bg-zinc-800/60"
                              : "bg-white dark:bg-zinc-900/90"
                          }`}
                        >
                          {b.port_name} · {b.berth_name}
                        </td>
                        {b.days.map((day) => (
                          <td
                            key={day.date}
                            className="min-w-[80px] border-l border-zinc-100/80 py-2 px-1.5 text-center align-middle dark:border-zinc-700/50"
                          >
                            {day.has_conflict ? (
                              <span
                                className="inline-flex cursor-default items-center justify-center rounded-md bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-800 dark:bg-red-950/50 dark:text-red-300"
                                title={day.scales.map((s) => `${s.ship_name}${s.pax_count != null ? ` (${s.pax_count} PAX)` : ""}`).join(" · ")}
                              >
                                Conflicto
                              </span>
                            ) : day.scales.length > 0 ? (
                              <span
                                className="inline-block max-w-full truncate rounded-md bg-[var(--admin-accent)]/15 px-2 py-1 text-xs font-medium text-[var(--admin-accent)] transition-opacity hover:opacity-90 dark:bg-[var(--admin-accent)]/20"
                                title={day.scales.map((s) => `${s.ship_name}${s.pax_count != null ? ` (${s.pax_count} PAX)` : ""}`).join(" · ")}
                              >
                                {day.scales[0].ship_name}
                                {day.scales[0].pax_count != null && day.scales[0].pax_count > 0 ? (
                                  <span className="ml-1 font-normal opacity-90">
                                    ({day.scales[0].pax_count})
                                  </span>
                                ) : null}
                              </span>
                            ) : (
                              <span className="text-zinc-300 dark:text-zinc-600">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
