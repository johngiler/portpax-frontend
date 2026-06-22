"use client";

import { Anchor } from "lucide-react";
import type { ShippingLine } from "@/types/cruise";

type ShippingLineStepProps = {
  lines: ShippingLine[];
  selectedId: number | null;
  onSelect: (lineId: number) => void;
  loading: boolean;
};

export default function ShippingLineStep({
  lines,
  selectedId,
  onSelect,
  loading,
}: ShippingLineStepProps) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl bg-zinc-200/80 dark:bg-zinc-800"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {lines.map((line) => {
        const selected = line.id === selectedId;
        return (
          <button
            key={line.id}
            type="button"
            onClick={() => onSelect(line.id)}
            className={[
              "flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200",
              selected
                ? "border-[var(--admin-accent)] bg-[var(--admin-accent)]/8 shadow-md shadow-[var(--admin-accent)]/10"
                : "border-zinc-200/80 bg-white hover:border-[var(--admin-accent)]/35 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/80",
            ].join(" ")}
          >
            <span
              className={[
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                selected
                  ? "bg-[var(--admin-accent)] text-white"
                  : "bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]",
              ].join(" ")}
            >
              <Anchor className="h-5 w-5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">{line.name}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {line.code} · {line.group_name}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
