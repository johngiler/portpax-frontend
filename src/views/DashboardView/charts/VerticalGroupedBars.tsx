"use client";

import { useState } from "react";
import ChartTooltip, { barFillVertical } from "./ChartTooltip";

type Series = {
  key: string;
  label: string;
  color: string;
};

type VerticalGroupedBarsProps = {
  categories: string[];
  series: Series[];
  values: Record<string, Record<string, number>>;
  emptyLabel?: string;
};

export default function VerticalGroupedBars({
  categories,
  series,
  values,
  emptyLabel = "Sin datos en el período",
}: VerticalGroupedBarsProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const max = Math.max(
    0,
    ...categories.flatMap((cat) => series.map((s) => values[cat]?.[s.key] ?? 0)),
  );

  if (max === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: barFillVertical(s.color) }}
            />
            {s.label}
          </span>
        ))}
      </div>
      <div className="flex h-44 items-end gap-1.5 sm:gap-2">
        {categories.map((cat) => {
          const monthTotal = series.reduce(
            (sum, s) => sum + (values[cat]?.[s.key] ?? 0),
            0,
          );
          const isActive = hovered === cat;
          return (
            <div
              key={cat}
              className="relative flex min-w-0 flex-1 flex-col items-center gap-1"
              onMouseEnter={() => setHovered(cat)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className={[
                  "flex h-36 w-full items-end justify-center gap-0.5 rounded-t-md transition-colors",
                  isActive ? "bg-zinc-900/[0.03] dark:bg-white/[0.04]" : "",
                ].join(" ")}
              >
                {series.map((s) => {
                  const value = values[cat]?.[s.key] ?? 0;
                  const height = max > 0 ? (value / max) * 100 : 0;
                  return (
                    <div
                      key={s.key}
                      className="w-full max-w-[10px] rounded-t-md sm:max-w-[12px]"
                      style={{
                        height: `${Math.max(height, value > 0 ? 4 : 0)}%`,
                        background: barFillVertical(s.color),
                        opacity: isActive || hovered === null ? 1 : 0.45,
                      }}
                    />
                  );
                })}
              </div>
              <span
                className={[
                  "truncate text-[10px] font-medium",
                  isActive ? "text-[var(--admin-accent)]" : "text-zinc-400",
                ].join(" ")}
              >
                {cat}
              </span>
              {isActive ? (
                <div className="absolute bottom-[calc(100%-0.25rem)] left-1/2 z-20 -translate-x-1/2">
                  <ChartTooltip
                    title={cat}
                    subtitle={`${monthTotal} reservas en el mes`}
                    rows={series.map((s) => ({
                      label: s.label,
                      value: String(values[cat]?.[s.key] ?? 0),
                      color: s.color,
                    }))}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
