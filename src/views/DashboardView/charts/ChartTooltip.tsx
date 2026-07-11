"use client";

type ChartTooltipRow = {
  label: string;
  value: string;
  color?: string;
};

type ChartTooltipProps = {
  title: string;
  subtitle?: string;
  rows: ChartTooltipRow[];
  className?: string;
};

/** Floating detail panel for chart hover states. */
export default function ChartTooltip({
  title,
  subtitle,
  rows,
  className = "",
}: ChartTooltipProps) {
  return (
    <div
      role="tooltip"
      className={[
        "pointer-events-none z-20 min-w-[10.5rem] max-w-[16rem] rounded-xl border border-white/60 bg-white/95 p-3 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.35)] backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-900/95",
        className,
      ].join(" ")}
    >
      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">{title}</p>
      {subtitle ? (
        <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">{subtitle}</p>
      ) : null}
      <ul className="mt-2 space-y-1.5">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between gap-3 text-[11px]"
          >
            <span className="flex min-w-0 items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
              {row.color ? (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
              ) : null}
              <span className="truncate">{row.label}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function barFill(accent: string): string {
  return `linear-gradient(90deg, ${accent} 0%, color-mix(in srgb, ${accent} 55%, white) 100%)`;
}

export function barFillVertical(accent: string): string {
  return `linear-gradient(180deg, color-mix(in srgb, ${accent} 70%, white) 0%, ${accent} 100%)`;
}
