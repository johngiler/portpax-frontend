"use client";

import type { ReactNode } from "react";

type ChartCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Soft tint for card background gradient */
  accent?: string;
};

export default function ChartCard({
  title,
  description,
  children,
  className = "",
  accent = "#3478b5",
}: ChartCardProps) {
  return (
    <section
      className={[
        "relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/90",
        className,
      ].join(" ")}
      style={{
        backgroundImage: `linear-gradient(160deg, color-mix(in srgb, ${accent} 12%, transparent) 0%, transparent 48%, color-mix(in srgb, ${accent} 6%, transparent) 100%)`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-40 blur-2xl"
        style={{ background: accent }}
        aria-hidden
      />
      <div className="relative">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
        ) : null}
        <div className="mt-4">{children}</div>
      </div>
    </section>
  );
}
