"use client";

import { MapPin } from "lucide-react";
import type { Port } from "@/types/catalog";
import { portDisplayName } from "@/types/catalog";

type PortStepProps = {
  ports: Port[];
  selectedId: number | null;
  onSelect: (portId: number) => void;
  loading: boolean;
};

export default function PortStep({ ports, selectedId, onSelect, loading }: PortStepProps) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl bg-zinc-200/80 dark:bg-zinc-800"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ports.map((port) => {
        const selected = port.id === selectedId;
        return (
          <button
            key={port.id}
            type="button"
            onClick={() => onSelect(port.id)}
            className={[
              "group flex cursor-pointer flex-col rounded-2xl border p-4 text-left transition-all duration-200",
              selected
                ? "border-[var(--admin-accent)] bg-[var(--admin-accent)]/8 shadow-md shadow-[var(--admin-accent)]/10"
                : "border-zinc-200/80 bg-white hover:-translate-y-0.5 hover:border-[var(--admin-accent)]/35 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/80",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <span
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  selected
                    ? "bg-[var(--admin-accent)] text-white"
                    : "bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]",
                ].join(" ")}
              >
                <MapPin className="h-5 w-5" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                  {portDisplayName(port)}
                </p>
                <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-[var(--admin-accent)]">
                  {port.code}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {port.country}
                  {port.region ? ` · ${port.region}` : ""}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
