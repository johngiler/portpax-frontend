"use client";

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
              style={{ backgroundColor: s.color }}
            />
            {s.label}
          </span>
        ))}
      </div>
      <div className="flex h-44 items-end gap-1.5 sm:gap-2">
        {categories.map((cat) => (
          <div key={cat} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex h-36 w-full items-end justify-center gap-0.5">
              {series.map((s) => {
                const value = values[cat]?.[s.key] ?? 0;
                const height = max > 0 ? (value / max) * 100 : 0;
                return (
                  <div
                    key={s.key}
                    title={`${s.label}: ${value}`}
                    className="w-full max-w-[10px] rounded-t-sm sm:max-w-[12px]"
                    style={{
                      height: `${Math.max(height, value > 0 ? 4 : 0)}%`,
                      backgroundColor: s.color,
                    }}
                  />
                );
              })}
            </div>
            <span className="truncate text-[10px] font-medium text-zinc-400">{cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
