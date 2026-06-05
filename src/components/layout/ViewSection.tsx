import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type ViewSectionProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

/** Content section with icon, title, and description. */
export default function ViewSection({
  icon: Icon,
  title,
  description,
  children,
  className = "",
}: ViewSectionProps) {
  return (
    <section
      className={`rounded-2xl border border-zinc-200/80 bg-white shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80 ${className}`}
    >
      <div className="border-b border-zinc-200/70 px-5 py-4 sm:px-6 sm:py-5 dark:border-zinc-800">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]"
            aria-hidden
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {title}
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}
