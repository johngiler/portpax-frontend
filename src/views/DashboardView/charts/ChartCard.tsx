"use client";

import type { ReactNode } from "react";

type ChartCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export default function ChartCard({
  title,
  description,
  children,
  className = "",
}: ChartCardProps) {
  return (
    <section
      className={[
        "rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80",
        className,
      ].join(" ")}
    >
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
      {description ? (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
