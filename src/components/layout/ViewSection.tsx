import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type ViewSectionProps = {
  icon: LucideIcon;
  /** Replaces the default Lucide icon box when provided (e.g. catalog logo). */
  leading?: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  /** Primary action aligned with the section header (e.g. SectionAddButton). */
  actions?: ReactNode;
  className?: string;
  /** Override default body padding (`p-3 sm:p-5 md:p-6`). */
  bodyClassName?: string;
  /** Soft tint + blur orb (dashboard cards), same language as ChartCard. */
  accent?: string;
};

/** Content section with icon, title, and description. */
export default function ViewSection({
  icon: Icon,
  leading,
  title,
  description,
  children,
  actions,
  className = "",
  bodyClassName = "p-3 sm:p-5 md:p-6",
  accent,
}: ViewSectionProps) {
  return (
    <section
      className={[
        "relative overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-[var(--admin-card-shadow)] sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-900/80",
        className,
      ].join(" ")}
      style={
        accent
          ? {
              backgroundImage: `linear-gradient(160deg, color-mix(in srgb, ${accent} 12%, transparent) 0%, transparent 48%, color-mix(in srgb, ${accent} 6%, transparent) 100%)`,
            }
          : undefined
      }
    >
      {accent ? (
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-40 blur-2xl"
          style={{ background: accent }}
          aria-hidden
        />
      ) : null}
      <div className="relative border-b border-zinc-200/70 px-3 py-2.5 sm:px-6 sm:py-5 dark:border-zinc-800">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="flex min-w-0 items-start gap-2 sm:gap-3">
            {leading ? (
              <div className="shrink-0">{leading}</div>
            ) : (
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-accent)]/10 text-[var(--admin-accent)] sm:h-10 sm:w-10 sm:rounded-xl"
                aria-hidden
                style={
                  accent
                    ? {
                        backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
                        color: accent,
                      }
                    : undefined
                }
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-semibold tracking-tight text-zinc-900 sm:text-base dark:text-zinc-50">
                {title}
              </h2>
              <p className="mt-0.5 hidden text-sm text-zinc-500 sm:block dark:text-zinc-400">
                {description}
              </p>
            </div>
          </div>
          {actions ? (
            <div className="shrink-0 self-end sm:self-start">{actions}</div>
          ) : null}
        </div>
      </div>
      <div className={`relative ${bodyClassName}`}>{children}</div>
    </section>
  );
}
