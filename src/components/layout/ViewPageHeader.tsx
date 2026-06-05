import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type ViewPageHeaderProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: ReactNode;
};

export default function ViewPageHeader({
  icon: Icon,
  title,
  description,
  actions,
}: ViewPageHeaderProps) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          <Icon
            className="h-7 w-7 shrink-0 text-[var(--admin-accent)]"
            strokeWidth={1.5}
            aria-hidden
          />
          {title}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
