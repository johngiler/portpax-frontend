"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import CatalogEntityLink from "@/components/ui/CatalogEntityLink";

const CARD_CLASS =
  "flex gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/40";

const LINK_CLASS = [
  CARD_CLASS,
  "transition-colors hover:border-[var(--admin-accent)]/45 hover:bg-[var(--admin-accent)]/5",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]/30",
].join(" ");

type IdentitySummaryCardProps = {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
  href?: string | null;
  hrefLabel?: string;
};

export default function IdentitySummaryCard({
  icon: Icon,
  label,
  children,
  href,
  hrefLabel,
}: IdentitySummaryCardProps) {
  return (
    <CatalogEntityLink
      href={href}
      className={LINK_CLASS}
      fallbackClassName={CARD_CLASS}
      ariaLabel={hrefLabel}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
        <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {children}
        </div>
      </div>
    </CatalogEntityLink>
  );
}
