"use client";

import { Anchor, CalendarDays, MapPin, Ship } from "lucide-react";
import type { Port } from "@/types/catalog";
import { portDisplayName } from "@/types/catalog";
import type { ShippingLine, Vessel } from "@/types/cruise";

type WizardSelectionSummaryProps = {
  port: Port | null;
  line: ShippingLine | null;
  vessel: Vessel | null;
  dateCount: number;
};

export default function WizardSelectionSummary({
  port,
  line,
  vessel,
  dateCount,
}: WizardSelectionSummaryProps) {
  if (!port && !line && !vessel && dateCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/60 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/40">
      {port ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm dark:bg-zinc-900 dark:text-zinc-200">
          <MapPin className="h-3.5 w-3.5 text-[var(--admin-accent)]" strokeWidth={2} />
          {portDisplayName(port)}
        </span>
      ) : null}
      {line ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm dark:bg-zinc-900 dark:text-zinc-200">
          <Anchor className="h-3.5 w-3.5 text-[var(--admin-accent)]" strokeWidth={2} />
          {line.name}
        </span>
      ) : null}
      {vessel ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm dark:bg-zinc-900 dark:text-zinc-200">
          <Ship className="h-3.5 w-3.5 text-[var(--admin-accent)]" strokeWidth={2} />
          {vessel.name}
        </span>
      ) : null}
      {dateCount > 0 ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--admin-accent)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--admin-accent)]">
          <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />
          {dateCount} fecha{dateCount === 1 ? "" : "s"}
        </span>
      ) : null}
    </div>
  );
}
