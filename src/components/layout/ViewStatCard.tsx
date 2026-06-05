import type { LucideIcon } from "lucide-react";

type ViewStatCardProps = {
  label: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  accentColor: string;
  gradient: string;
};

/** KPI / summary card used in dashboard and list views. */
export default function ViewStatCard({
  label,
  value,
  description,
  icon: Icon,
  accentColor,
  gradient,
}: ViewStatCardProps) {
  return (
    <div
      className="relative flex min-h-[130px] items-start justify-between gap-4 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80"
      style={{
        borderTopWidth: "3px",
        borderTopColor: accentColor,
        background: gradient,
      }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {label}
        </p>
        <p className="mt-1.5 text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
          {value}
        </p>
        <p className="mt-1 truncate text-[11px] text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${accentColor}18` }}
        aria-hidden
      >
        <Icon className="h-5 w-5" style={{ color: accentColor }} strokeWidth={2} />
      </div>
    </div>
  );
}
