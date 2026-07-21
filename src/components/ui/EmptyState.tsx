"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { SearchX } from "lucide-react";

const PRIMARY_BUTTON_CLASS =
  "btn-primary-gradient inline-flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.18)] transition-all hover:brightness-105 hover:shadow-[0_8px_22px_-14px_rgba(52,120,181,0.7)]";

const CLEAR_BUTTON_CLASS =
  "cursor-pointer rounded-md border border-zinc-200/80 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";

export type EmptyStateAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: LucideIcon;
};

type EmptyStateProps = {
  /** Icon shown when there are no results and no active filters. */
  icon: LucideIcon;
  /** True when the empty result is caused by search/filters. */
  filtered?: boolean;
  title: string;
  description: string;
  primaryAction?: EmptyStateAction;
  onClearFilters?: () => void;
  className?: string;
};

/**
 * Shared empty / no-results state (search, filters, or first-run).
 * Canonical design used across list and report views.
 */
export default function EmptyState({
  icon: Icon,
  filtered = false,
  title,
  description,
  primaryAction,
  onClearFilters,
  className = "",
}: EmptyStateProps) {
  const HeaderIcon = filtered ? SearchX : Icon;
  const ActionIcon = primaryAction?.icon;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-white via-[var(--admin-accent)]/[0.05] to-zinc-50 px-6 py-12 text-center shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 ${className}`}
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
        <HeaderIcon className="h-8 w-8" strokeWidth={1.5} aria-hidden />
      </div>

      <h2 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
        {description}
      </p>

      {primaryAction || (filtered && onClearFilters) ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {primaryAction ? (
            primaryAction.href ? (
              <Link href={primaryAction.href} className={PRIMARY_BUTTON_CLASS}>
                {ActionIcon ? (
                  <ActionIcon className="h-4 w-4" strokeWidth={2} />
                ) : null}
                {primaryAction.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className={PRIMARY_BUTTON_CLASS}
              >
                {ActionIcon ? (
                  <ActionIcon className="h-4 w-4" strokeWidth={2} />
                ) : null}
                {primaryAction.label}
              </button>
            )
          ) : null}

          {filtered && onClearFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className={CLEAR_BUTTON_CLASS}
            >
              Limpiar filtros
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
