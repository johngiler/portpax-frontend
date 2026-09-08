"use client";

import { useMemo, useState } from "react";
import type { DashboardByPortMonth } from "@/types/dashboard";
import ChartTooltip from "./ChartTooltip";

const MONTH_LABELS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const MONTH_SHORT = [
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

const PORT_COLORS = [
  "#3478b5",
  "#ea580c",
  "#16a34a",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#ca8a04",
  "#0d9488",
];

type PortMonthComboChartProps = {
  data: DashboardByPortMonth;
  mode: "chart" | "table";
};

function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const factor = 10 ** exp;
  const normalized = value / factor;
  const steps = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const nice = steps.find((step) => normalized <= step) ?? 10;
  return nice * factor;
}

function formatAxisPax(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString("es", { maximumFractionDigits: 1 })}M`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toLocaleString("es", { maximumFractionDigits: 1 })}k`;
  }
  return n.toLocaleString("es");
}

function buildTicks(max: number, count = 5): number[] {
  if (max <= 0) return [0];
  const ticks: number[] = [];
  for (let i = 0; i <= count; i++) {
    ticks.push(Math.round((max * i) / count));
  }
  return [...new Set(ticks)];
}

/** Bar box + center X so the line marker sits on the same vertical as the bar. */
function barLayout(
  groupX: number,
  groupW: number,
  seriesIndex: number,
  seriesCount: number,
) {
  const slot = groupW / Math.max(seriesCount, 1);
  const bx = groupX + seriesIndex * slot + slot * 0.18;
  const bw = Math.max(slot * 0.64, 5);
  return { bx, bw, cx: bx + bw / 2 };
}

export default function PortMonthComboChart({
  data,
  mode,
}: PortMonthComboChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [hiddenPorts, setHiddenPorts] = useState<Set<number>>(() => new Set());
  const [showPax, setShowPax] = useState(true);
  const [showCalls, setShowCalls] = useState(true);
  const ports = data.ports ?? [];

  const series = useMemo(
    () =>
      ports.map((port, index) => ({
        port,
        color: PORT_COLORS[index % PORT_COLORS.length],
      })),
    [ports],
  );

  const visibleSeries = useMemo(
    () => series.filter(({ port }) => !hiddenPorts.has(port.port_id)),
    [series, hiddenPorts],
  );

  const maxPax = niceCeiling(
    Math.max(
      1,
      ...visibleSeries.flatMap(({ port }) =>
        port.months.map((m) => m.passengers),
      ),
    ),
  );
  const maxCalls = niceCeiling(
    Math.max(
      1,
      ...visibleSeries.flatMap(({ port }) => port.months.map((m) => m.calls)),
    ),
  );

  const paxTicks = useMemo(() => buildTicks(maxPax, 5), [maxPax]);
  const callTicks = useMemo(() => buildTicks(maxCalls, 5), [maxCalls]);

  function togglePort(portId: number) {
    setHiddenPorts((prev) => {
      const next = new Set(prev);
      if (next.has(portId)) next.delete(portId);
      else next.add(portId);
      // Keep at least one port visible
      if (next.size >= series.length) return prev;
      return next;
    });
  }

  if (ports.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
        Sin datos en el período
      </p>
    );
  }

  if (mode === "table") {
    return (
      <div className="max-h-80 overflow-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-100 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
              <th className="py-2 pr-2">Puerto</th>
              {MONTH_SHORT.map((label) => (
                <th key={label} className="px-1 py-2 text-right">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {series.map(({ port, color }) => (
              <tr
                key={port.port_id}
                className="border-b border-zinc-50 dark:border-zinc-800/60"
              >
                <td className="py-2 pr-2">
                  <span className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-100">
                    <span
                      className="h-2 w-2 shrink-0 rounded-sm"
                      style={{ background: color }}
                    />
                    {port.name}
                  </span>
                  <p className="text-[10px] text-zinc-400">
                    Calls / Pax planificados
                  </p>
                </td>
                {port.months.map((point) => (
                  <td
                    key={point.month}
                    className="px-1 py-2 text-right tabular-nums text-zinc-600 dark:text-zinc-300"
                  >
                    <span className="block">{point.calls}</span>
                    <span className="block text-[10px] text-zinc-400">
                      {point.passengers.toLocaleString("es")}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const chartW = 1200;
  const chartH = 300;
  const padTop = 8;
  const padBottom = 4;
  const svgH = chartH + padTop + padBottom;
  const groupW = chartW / 12;
  const visibleCount = Math.max(visibleSeries.length, 1);

  const paxToY = (pax: number) =>
    padTop + chartH * (1 - Math.min(Math.max(pax, 0) / maxPax, 1));
  const callsToBarH = (calls: number) =>
    chartH * Math.min(Math.max(calls, 0) / maxCalls, 1);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {series.map(({ port, color }) => {
          const active = !hiddenPorts.has(port.port_id);
          return (
            <button
              key={port.port_id}
              type="button"
              aria-pressed={active}
              title={active ? `Ocultar ${port.name}` : `Mostrar ${port.name}`}
              onClick={() => togglePort(port.port_id)}
              className={[
                "flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] transition-opacity",
                active
                  ? "text-zinc-600 opacity-100 dark:text-zinc-300"
                  : "text-zinc-400 opacity-40 line-through",
              ].join(" ")}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ background: color }}
              />
              {port.name}
            </button>
          );
        })}
        <span className="mx-1 hidden h-3 w-px bg-zinc-200 sm:inline-block dark:bg-zinc-700" />
        <button
          type="button"
          aria-pressed={showPax}
          title={showPax ? "Ocultar líneas de pax" : "Mostrar líneas de pax"}
          onClick={() => setShowPax((v) => !v)}
          className={[
            "flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] transition-opacity",
            showPax
              ? "text-zinc-500 opacity-100"
              : "text-zinc-400 opacity-40 line-through",
          ].join(" ")}
        >
          <span className="inline-block h-0.5 w-3 rounded bg-zinc-500" />
          Pax (línea · eje izq.)
        </button>
        <button
          type="button"
          aria-pressed={showCalls}
          title={
            showCalls ? "Ocultar barras de calls" : "Mostrar barras de calls"
          }
          onClick={() => setShowCalls((v) => !v)}
          className={[
            "flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] transition-opacity",
            showCalls
              ? "text-zinc-500 opacity-100"
              : "text-zinc-400 opacity-40 line-through",
          ].join(" ")}
        >
          <span
            className="inline-block h-2.5 w-2 rounded-sm"
            style={{ background: "#3478b5", opacity: 0.45 }}
          />
          Calls (barra · eje der.)
        </button>
      </div>

      <div className="relative w-full">
        <div className="flex h-[24rem] w-full flex-col sm:h-[28rem]">
          {/* Plot row only — Y ticks align with SVG, not month labels */}
          <div className="flex min-h-0 flex-1 gap-1">
            {/* Left Y — Pax */}
            <div className="relative w-12 shrink-0 sm:w-14">
              <span
                className="absolute left-0 top-1/2 text-[9px] font-semibold uppercase tracking-wide text-zinc-500"
                style={{
                  writingMode: "vertical-rl",
                  transform: "translateY(-50%) rotate(180deg)",
                }}
              >
                Pax
              </span>
              {paxTicks.map((tick) => (
                <span
                  key={`pax-${tick}`}
                  className="absolute right-0 -translate-y-1/2 text-[10px] tabular-nums text-zinc-500"
                  style={{ top: `${(1 - tick / maxPax) * 100}%` }}
                >
                  {formatAxisPax(tick)}
                </span>
              ))}
            </div>

            <div className="relative min-w-0 flex-1">
              <svg
                viewBox={`0 0 ${chartW} ${svgH}`}
                className="block h-full w-full"
                preserveAspectRatio="none"
                role="img"
                aria-label="Pasajeros y calls por mes y puerto"
              >
                {paxTicks.map((tick) => {
                  const y = paxToY(tick);
                  return (
                    <line
                      key={`grid-${tick}`}
                      x1={0}
                      x2={chartW}
                      y1={y}
                      y2={y}
                      stroke="#e4e4e7"
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}

                {MONTH_LABELS.map((label, monthIdx) => {
                  const month = monthIdx + 1;
                  const gx = monthIdx * groupW;
                  return (
                    <g key={label}>
                      <rect
                        x={gx}
                        y={padTop}
                        width={groupW}
                        height={chartH}
                        fill={
                          hovered === month
                            ? "rgba(24,24,27,0.04)"
                            : "transparent"
                        }
                        onMouseEnter={() => setHovered(month)}
                        onMouseLeave={() => setHovered(null)}
                      />
                      {showCalls
                        ? visibleSeries.map(({ port, color }, si) => {
                            const point = port.months.find(
                              (m) => m.month === month,
                            );
                            const calls = point?.calls ?? 0;
                            const barH = callsToBarH(calls);
                            const { bx, bw } = barLayout(
                              gx,
                              groupW,
                              si,
                              visibleCount,
                            );
                            return (
                              <rect
                                key={`${port.port_id}-bar`}
                                x={bx}
                                y={padTop + chartH - barH}
                                width={bw}
                                height={Math.max(barH, calls > 0 ? 2 : 0)}
                                rx={1.5}
                                fill={color}
                                opacity={
                                  hovered === null || hovered === month
                                    ? 0.45
                                    : 0.18
                                }
                                pointerEvents="none"
                              />
                            );
                          })
                        : null}
                    </g>
                  );
                })}

                {showPax
                  ? visibleSeries.map(({ port, color }, si) => {
                      const pts = port.months.map((point, monthIdx) => {
                        const gx = monthIdx * groupW;
                        const { cx } = barLayout(gx, groupW, si, visibleCount);
                        const y = paxToY(point.passengers);
                        return `${cx},${y}`;
                      });
                      return (
                        <g key={`${port.port_id}-line`} pointerEvents="none">
                          <polyline
                            fill="none"
                            stroke={color}
                            strokeWidth={2.75}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            points={pts.join(" ")}
                            vectorEffect="non-scaling-stroke"
                          />
                          {port.months.map((point, monthIdx) => {
                            const gx = monthIdx * groupW;
                            const { cx } = barLayout(
                              gx,
                              groupW,
                              si,
                              visibleCount,
                            );
                            const y = paxToY(point.passengers);
                            return (
                              <circle
                                key={point.month}
                                cx={cx}
                                cy={y}
                                r={4}
                                fill={color}
                                stroke="#fff"
                                strokeWidth={1.75}
                                vectorEffect="non-scaling-stroke"
                              />
                            );
                          })}
                        </g>
                      );
                    })
                  : null}
              </svg>
            </div>

            {/* Right Y — Calls */}
            <div className="relative w-10 shrink-0 sm:w-12">
              <span
                className="absolute right-0 top-1/2 text-[9px] font-semibold uppercase tracking-wide text-zinc-500"
                style={{
                  writingMode: "vertical-rl",
                  transform: "translateY(-50%)",
                }}
              >
                Calls
              </span>
              {callTicks.map((tick) => (
                <span
                  key={`calls-${tick}`}
                  className="absolute left-0 -translate-y-1/2 text-[10px] tabular-nums text-zinc-500"
                  style={{ top: `${(1 - tick / maxCalls) * 100}%` }}
                >
                  {tick.toLocaleString("es")}
                </span>
              ))}
            </div>
          </div>

          {/* Months under plot — short labels so inclined text stays separated */}
          <div className="mt-5 flex gap-1 pt-2">
            <div className="w-12 shrink-0 sm:w-14" aria-hidden />
            <div className="grid h-14 min-w-0 flex-1 grid-cols-12 gap-0">
              {MONTH_SHORT.map((label) => (
                <div
                  key={label}
                  className="relative flex items-start justify-center overflow-visible"
                >
                  <span
                    className="whitespace-nowrap text-[11px] font-semibold tracking-wide text-zinc-600 dark:text-zinc-300"
                    style={{
                      transform: "rotate(-35deg)",
                      transformOrigin: "center top",
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div className="w-10 shrink-0 sm:w-12" aria-hidden />
          </div>
        </div>

        {hovered != null ? (
          <div className="absolute left-1/2 top-2 z-20 -translate-x-1/2">
            <ChartTooltip
              title={MONTH_LABELS[hovered - 1]}
              subtitle="Pax (línea) · Calls (barra)"
              rows={visibleSeries.flatMap(({ port, color }) => {
                const point = port.months.find((m) => m.month === hovered);
                const rows = [];
                if (showPax) {
                  rows.push({
                    label: `${port.name} · pax`,
                    value: (point?.passengers ?? 0).toLocaleString("es"),
                    color,
                  });
                }
                if (showCalls) {
                  rows.push({
                    label: `${port.name} · calls`,
                    value: String(point?.calls ?? 0),
                    color,
                  });
                }
                return rows;
              })}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
