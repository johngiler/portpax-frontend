"use client";

type BarItem = {
  label: string;
  value: number;
  hint?: string;
};

type HorizontalBarChartProps = {
  items: BarItem[];
  accent?: string;
  emptyLabel?: string;
};

export default function HorizontalBarChart({
  items,
  accent = "var(--admin-accent)",
  emptyLabel = "Sin datos en el período",
}: HorizontalBarChartProps) {
  const max = Math.max(...items.map((item) => item.value), 0);

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
        return (
          <li key={item.label}>
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
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${pct}%`, backgroundColor: accent }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
