import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type ViewPageHeaderProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Optional KPI / counters under the title (e.g. filtered booking totals). */
  stats?: ReactNode;
  actions?: ReactNode;
};

export default function ViewPageHeader({
  icon: Icon,
  title,
  description,
  stats,
  actions,
}: ViewPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">
          <Icon
            className="h-6 w-6 shrink-0 text-[var(--admin-accent)] sm:h-7 sm:w-7"
            strokeWidth={1.5}
            aria-hidden
          />
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        ) : null}
        {stats ? (
          <div className={description ? "mt-2" : "mt-1.5"}>{stats}</div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
