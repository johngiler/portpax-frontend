"use client";

import { useState } from "react";
import ChartTooltip, { barFill } from "./ChartTooltip";

type BarItem = {
  label: string;
  value: number;
  hint?: string;
};

type HorizontalBarChartProps = {
  items: BarItem[];
  accent?: string;
  emptyLabel?: string;
  valueSuffix?: string;
};

export default function HorizontalBarChart({
  items,
  accent = "#3478b5",
  emptyLabel = "Sin datos en el período",
  valueSuffix = "reservas",
}: HorizontalBarChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const max = Math.max(...items.map((item) => item.value), 0);
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (items.length === 0 || max === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const pct = max > 0 ? (item.value / max) * 100 : 0;
        const share = total > 0 ? Math.round((item.value / total) * 100) : 0;
        const isActive = hovered === item.label;
        return (
          <li
            key={item.label}
            className="relative"
            onMouseEnter={() => setHovered(item.label)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-200">
                {item.label}
              </span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-zinc-500">
                {item.value}
                {item.hint ? (
                  <span className="ml-1 font-normal text-zinc-400">{item.hint}</span>
                ) : null}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100/90 ring-1 ring-zinc-200/60 dark:bg-zinc-800 dark:ring-zinc-700">
              <div
                className={[
                  "h-full rounded-full transition-all duration-500",
                  isActive ? "brightness-110 saturate-125" : "",
                ].join(" ")}
                style={{
                  width: `${pct}%`,
                  background: barFill(accent),
                  boxShadow: isActive
                    ? `0 0 12px color-mix(in srgb, ${accent} 45%, transparent)`
                    : undefined,
                }}
              />
            </div>
            {isActive ? (
              <div className="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2">
                <ChartTooltip
                  title={item.label}
                  subtitle={item.hint?.replace(/^·\s*/, "")}
                  rows={[
                    { label: valueSuffix, value: String(item.value), color: accent },
                    { label: "Participación", value: `${share}%` },
                  ]}
                />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
