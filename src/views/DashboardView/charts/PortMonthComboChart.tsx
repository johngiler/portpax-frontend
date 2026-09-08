"use client";

import { useMemo, useState } from "react";
import type { DashboardByPortMonth } from "@/types/dashboard";
import ChartTooltip from "./ChartTooltip";

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

/** Bottom band of the chart height reserved for 0…lowMax (makes calls visible). */
const LOW_BAND_FRAC = 0.3;
const LOW_BAND_MAX = 100;

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

/** Piecewise scale: 0…lowMax → bottom band; lowMax…maxY → rest. */
function valueToPlotRatio(value: number, maxY: number, lowMax: number): number {
  const v = Math.max(0, value);
  if (v <= lowMax) {
    return (v / lowMax) * LOW_BAND_FRAC;
  }
  const highSpan = Math.max(maxY - lowMax, 1);
  return LOW_BAND_FRAC + ((v - lowMax) / highSpan) * (1 - LOW_BAND_FRAC);
}

export default function PortMonthComboChart({
  data,
  mode,
}: PortMonthComboChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const ports = data.ports ?? [];

  const series = useMemo(
    () =>
      ports.map((port, index) => ({
        port,
        color: PORT_COLORS[index % PORT_COLORS.length],
      })),
    [ports],
  );

  const rawMaxCalls = Math.max(
    0,
    ...series.flatMap(({ port }) => port.months.map((m) => m.calls)),
  );
  const rawMaxPax = Math.max(
    0,
    ...series.flatMap(({ port }) => port.months.map((m) => m.passengers)),
  );
  // Cut = at least 100, or ceil(max calls) when calls go higher (e.g. 200).
  const lowMax = Math.max(LOW_BAND_MAX, niceCeiling(Math.max(1, rawMaxCalls)));
  const maxY = Math.max(niceCeiling(Math.max(1, rawMaxPax)), lowMax * 2);

  const yTicks = useMemo(() => {
    const lowHalf = Math.round(lowMax / 2);
    const low = [
      { value: 0, kind: "low" as const },
      ...(lowHalf > 0 && lowHalf < lowMax
        ? [{ value: lowHalf, kind: "low" as const }]
        : []),
      { value: lowMax, kind: "break" as const },
    ];

    const high: { value: number; kind: "high" }[] = [];
    for (const t of [0.25, 0.5, 0.75, 1]) {
      // Round to whole thousands so the upper band “cuadra” in xK.
      const raw = maxY * t;
      const rounded =
        raw >= 1000 ? Math.round(raw / 1000) * 1000 : Math.round(raw);
      if (rounded <= lowMax) continue;
      if (high.some((h) => h.value === rounded)) continue;
      high.push({ value: rounded, kind: "high" });
    }
    if (!high.some((h) => h.value === maxY) && maxY > lowMax) {
      high.push({ value: maxY, kind: "high" });
    }

    return [...low, ...high].map((tick) => ({
      ...tick,
      ratio: valueToPlotRatio(tick.value, maxY, lowMax),
    }));
  }, [lowMax, maxY]);

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
              {MONTH_LABELS.map((label) => (
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
  const plotTopPct = (padTop / svgH) * 100;
  const plotHeightPct = (chartH / svgH) * 100;
  const groupW = chartW / 12;
  const breakY =
    padTop + chartH - valueToPlotRatio(lowMax, maxY, lowMax) * chartH;

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3">
        {series.map(({ port, color }) => (
          <span
            key={port.port_id}
            className="flex items-center gap-1.5 text-[11px] text-zinc-500"
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: color }}
            />
            {port.name}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <span className="inline-block h-0.5 w-3 rounded bg-zinc-500" />
          Pax (línea)
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <span
            className="inline-block h-2.5 w-2 rounded-sm"
            style={{ background: "#3478b5", opacity: 0.45 }}
          />
          Calls (barra · zona 0–{lowMax.toLocaleString("es")})
        </span>
      </div>

      <div className="relative w-full">
        <div className="flex h-[22rem] w-full gap-1 sm:h-[26rem]">
          <div className="relative w-14 shrink-0 sm:w-16">
            <div
              className="absolute left-0 right-0"
              style={{ top: `${plotTopPct}%`, height: `${plotHeightPct}%` }}
            >
              {/* Upper band → Pax */}
              <span
                className="absolute left-0 text-[9px] font-semibold uppercase tracking-wide text-zinc-500"
                style={{
                  top: `${((1 - LOW_BAND_FRAC) / 2) * 100}%`,
                  writingMode: "vertical-rl",
                  transform: "translateY(-50%) rotate(180deg)",
                }}
              >
                Pax
              </span>
              {/* Lower band (0 → cut) → Calls */}
              <span
                className="absolute left-0 text-[9px] font-semibold uppercase tracking-wide text-zinc-500"
                style={{
                  top: `${(1 - LOW_BAND_FRAC / 2) * 100}%`,
                  writingMode: "vertical-rl",
                  transform: "translateY(-50%) rotate(180deg)",
                }}
              >
                Calls
              </span>
              {yTicks.map((tick) => (
                <span
                  key={`y-${tick.kind}-${tick.value}`}
                  className={[
                    "absolute right-0 -translate-y-1/2 tabular-nums",
                    tick.kind === "break"
                      ? "text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                      : "text-[10px] text-zinc-500",
                  ].join(" ")}
                  style={{ top: `${(1 - tick.ratio) * 100}%` }}
                >
                  {tick.kind === "high"
                    ? formatAxisPax(tick.value)
                    : tick.value.toLocaleString("es")}
                </span>
              ))}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="relative min-h-0 flex-1">
              <svg
                viewBox={`0 0 ${chartW} ${svgH}`}
                className="block h-full w-full"
                preserveAspectRatio="none"
                role="img"
                aria-label="Pasajeros y calls por mes y puerto"
              >
                {/* Magnified lower band (0 → lowMax / cut) */}
                <rect
                  x={0}
                  y={breakY}
                  width={chartW}
                  height={padTop + chartH - breakY}
                  fill="rgba(52, 120, 181, 0.05)"
                />

                {yTicks
                  .filter((tick) => tick.kind !== "break")
                  .map((tick) => {
                    const y = padTop + chartH * (1 - tick.ratio);
                    return (
                      <line
                        key={`grid-${tick.kind}-${tick.value}`}
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

                {/* Cut exactly at lowMax (100, 200, …) before the xK band */}
                <line
                  x1={0}
                  x2={chartW}
                  y1={breakY}
                  y2={breakY}
                  stroke="#64748b"
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  vectorEffect="non-scaling-stroke"
                />

                {MONTH_LABELS.map((label, monthIdx) => {
                  const month = monthIdx + 1;
                  const gx = monthIdx * groupW;
                  const barSlot = groupW / Math.max(series.length, 1);
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
                      {series.map(({ port, color }, si) => {
                        const point = port.months.find((m) => m.month === month);
                        const calls = point?.calls ?? 0;
                        const ratio = valueToPlotRatio(calls, maxY, lowMax);
                        const barH = ratio * chartH;
                        const bx = gx + si * barSlot + barSlot * 0.18;
                        const bw = Math.max(barSlot * 0.64, 5);
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
                              hovered === null || hovered === month ? 0.5 : 0.2
                            }
                            pointerEvents="none"
                          />
                        );
                      })}
                    </g>
                  );
                })}

                {series.map(({ port, color }) => {
                  const pts = port.months.map((point, monthIdx) => {
                    const x = monthIdx * groupW + groupW / 2;
                    const ratio = valueToPlotRatio(
                      point.passengers,
                      maxY,
                      lowMax,
                    );
                    const y = padTop + chartH - ratio * chartH;
                    return `${x},${y}`;
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
                        const x = monthIdx * groupW + groupW / 2;
                        const ratio = valueToPlotRatio(
                          point.passengers,
                          maxY,
                          lowMax,
                        );
                        const y = padTop + chartH - ratio * chartH;
                        return (
                          <circle
                            key={point.month}
                            cx={x}
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
                })}
              </svg>
            </div>

            {/* HTML month labels — not stretched by SVG preserveAspectRatio=none */}
            <div className="mt-1 grid grid-cols-12 gap-0 px-0.5">
              {MONTH_LABELS.map((label) => (
                <span
                  key={label}
                  className="truncate text-center text-[10px] font-medium text-zinc-400"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {hovered != null ? (
          <div className="absolute left-1/2 top-2 z-20 -translate-x-1/2">
            <ChartTooltip
              title={MONTH_LABELS[hovered - 1]}
              subtitle={`Corte en ${lowMax.toLocaleString("es")} · arriba escala pax (xK)`}
              rows={series.flatMap(({ port, color }) => {
                const point = port.months.find((m) => m.month === hovered);
                return [
                  {
                    label: `${port.name} · pax`,
                    value: (point?.passengers ?? 0).toLocaleString("es"),
                    color,
                  },
                  {
                    label: `${port.name} · calls`,
                    value: String(point?.calls ?? 0),
                    color,
                  },
                ];
              })}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
