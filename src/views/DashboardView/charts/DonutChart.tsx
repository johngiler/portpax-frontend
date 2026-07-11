"use client";

import { useId, useMemo, useState } from "react";
import ChartTooltip from "./ChartTooltip";

type Slice = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type DonutChartProps = {
  slices: Slice[];
  centerLabel?: string;
  centerValue?: string | number;
  emptyLabel?: string;
};

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/** Closed donut ring segment (outer arc → inner arc). */
function donutSegmentPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const sweep = endAngle - startAngle;
  if (sweep <= 0.001) return "";

  // Full circle cannot be a single arc — leave a hairline gap for SVG arc math
  const safeEnd = sweep >= 359.999 ? startAngle + 359.999 : endAngle;
  const largeArc = safeEnd - startAngle > 180 ? 1 : 0;

  const outerStart = polar(cx, cy, outerR, startAngle);
  const outerEnd = polar(cx, cy, outerR, safeEnd);
  const innerEnd = polar(cx, cy, innerR, safeEnd);
  const innerStart = polar(cx, cy, innerR, startAngle);

  return [
    `M ${outerStart.x.toFixed(3)} ${outerStart.y.toFixed(3)}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x.toFixed(3)} ${outerEnd.y.toFixed(3)}`,
    `L ${innerEnd.x.toFixed(3)} ${innerEnd.y.toFixed(3)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x.toFixed(3)} ${innerStart.y.toFixed(3)}`,
    "Z",
  ].join(" ");
}

export default function DonutChart({
  slices,
  centerLabel,
  centerValue,
  emptyLabel = "Sin datos en el período",
}: DonutChartProps) {
  const gradId = useId().replace(/:/g, "");
  const [hovered, setHovered] = useState<string | null>(null);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  const segments = useMemo(() => {
    if (total <= 0) return [];
    let cursor = 0;
    return slices
      .filter((slice) => slice.value > 0)
      .map((slice) => {
        const start = (cursor / total) * 360;
        cursor += slice.value;
        const end = (cursor / total) * 360;
        return { ...slice, start, end };
      });
  }, [slices, total]);

  if (total === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
        {emptyLabel}
      </p>
    );
  }

  const cx = 50;
  const cy = 50;
  const outerR = 46;
  const innerR = 30;

  return (
    <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <defs>
            {segments.map((slice) => (
              <linearGradient
                key={slice.key}
                id={`${gradId}-${slice.key}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={slice.color} stopOpacity="1" />
                <stop offset="100%" stopColor={slice.color} stopOpacity="0.65" />
              </linearGradient>
            ))}
          </defs>
          <circle
            cx={cx}
            cy={cy}
            r={(outerR + innerR) / 2}
            fill="none"
            stroke="currentColor"
            strokeWidth={outerR - innerR}
            className="text-zinc-100 dark:text-zinc-800"
          />
          {segments.map((slice) => {
            const path = donutSegmentPath(
              cx,
              cy,
              innerR,
              outerR,
              slice.start,
              slice.end,
            );
            if (!path) return null;
            const isActive = hovered === slice.key;
            return (
              <path
                key={slice.key}
                d={path}
                fill={`url(#${gradId}-${slice.key})`}
                className="cursor-pointer transition-opacity duration-150"
                style={{
                  opacity: hovered === null || isActive ? 1 : 0.38,
                  filter: isActive
                    ? `drop-shadow(0 1px 3px color-mix(in srgb, ${slice.color} 55%, transparent))`
                    : undefined,
                }}
                onMouseEnter={() => setHovered(slice.key)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue != null ? (
            <span className="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
              {centerValue}
            </span>
          ) : null}
          {centerLabel ? (
            <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
              {centerLabel}
            </span>
          ) : null}
        </div>
      </div>
      <ul className="w-full space-y-2">
        {slices.map((slice) => {
          const pct = Math.round((slice.value / total) * 100);
          const isActive = hovered === slice.key;
          return (
            <li
              key={slice.key}
              className={[
                "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors",
                isActive
                  ? "bg-white/80 shadow-sm dark:bg-zinc-800/80"
                  : "hover:bg-white/50 dark:hover:bg-zinc-800/40",
              ].join(" ")}
              onMouseEnter={() => setHovered(slice.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="flex min-w-0 items-center gap-2 text-zinc-600 dark:text-zinc-300">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${slice.color}, color-mix(in srgb, ${slice.color} 50%, white))`,
                  }}
                />
                <span className="truncate font-medium">{slice.label}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">
                {slice.value}
                <span className="ml-1 font-normal text-zinc-400">({pct}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
      {hovered ? (
        <div className="absolute left-1/2 top-2 z-20 -translate-x-1/2 sm:left-auto sm:right-2 sm:top-0 sm:translate-x-0">
          <ChartTooltip
            title={slices.find((s) => s.key === hovered)?.label ?? ""}
            subtitle="Estado de reserva"
            rows={[
              {
                label: "Cantidad",
                value: String(slices.find((s) => s.key === hovered)?.value ?? 0),
                color: slices.find((s) => s.key === hovered)?.color,
              },
              {
                label: "Del total",
                value: `${Math.round(
                  ((slices.find((s) => s.key === hovered)?.value ?? 0) / total) *
                    100,
                )}%`,
              },
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}
