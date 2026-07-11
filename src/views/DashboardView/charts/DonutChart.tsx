"use client";

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

export default function DonutChart({
  slices,
  centerLabel,
  centerValue,
  emptyLabel = "Sin datos en el período",
}: DonutChartProps) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  if (total === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
        {emptyLabel}
      </p>
    );
  }

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 100 100" className="-rotate-90 h-full w-full">
          {slices.map((slice) => {
            const length = (slice.value / total) * circumference;
            const dash = `${length} ${circumference - length}`;
            const el = (
              <circle
                key={slice.key}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth="12"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
              />
            );
            offset += length;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
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
        {slices.map((slice) => (
          <li key={slice.key} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate">{slice.label}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">
              {slice.value}
              <span className="ml-1 font-normal text-zinc-400">
                ({Math.round((slice.value / total) * 100)}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
