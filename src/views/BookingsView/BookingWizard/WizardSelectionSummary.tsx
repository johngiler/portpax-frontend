"use client";

import { Anchor, CalendarDays, LayoutGrid, MapPin, Ship } from "lucide-react";
import type { Port } from "@/types/catalog";
import { portDisplayName } from "@/types/catalog";
import type { ShippingLine, Vessel } from "@/types/cruise";

type WizardSelectionSummaryProps = {
  port: Port | null;
  line: ShippingLine | null;
  vessel: Vessel | null;
  dateCount: number;
  positionLabel?: string | null;
  compact?: boolean;
};

export default function WizardSelectionSummary({
  port,
  line,
  vessel,
  dateCount,
  positionLabel = null,
  compact = false,
}: WizardSelectionSummaryProps) {
  if (!port && !line && !vessel && dateCount === 0 && !positionLabel) return null;

  const chip = compact
    ? "inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-700 shadow-sm dark:bg-zinc-900 dark:text-zinc-200"
    : "inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm dark:bg-zinc-900 dark:text-zinc-200";
  const iconClass = compact ? "h-3 w-3 text-[var(--admin-accent)]" : "h-3.5 w-3.5 text-[var(--admin-accent)]";
  const dateChip = compact
    ? "inline-flex items-center gap-1 rounded-full bg-[var(--admin-accent)]/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--admin-accent)]"
    : "inline-flex items-center gap-1.5 rounded-full bg-[var(--admin-accent)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--admin-accent)]";

  return (
    <div
      className={
        compact
          ? "flex flex-wrap items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50/60 px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-950/40"
          : "flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/60 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/40"
      }
    >
      {port ? (
        <span className={chip}>
          <MapPin className={iconClass} strokeWidth={2} />
          {portDisplayName(port)}
        </span>
      ) : null}
      {positionLabel ? (
        <span className={chip}>
          <LayoutGrid className={iconClass} strokeWidth={2} />
          {positionLabel}
        </span>
      ) : null}
      {line ? (
        <span className={chip}>
          <Anchor className={iconClass} strokeWidth={2} />
          {line.name}
        </span>
      ) : null}
      {vessel ? (
        <span className={chip}>
          <Ship className={iconClass} strokeWidth={2} />
          {vessel.name}
        </span>
      ) : null}
      {dateCount > 0 ? (
        <span className={dateChip}>
          <CalendarDays className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={2} />
          {dateCount} fecha{dateCount === 1 ? "" : "s"}
        </span>
      ) : null}
    </div>
  );
}
