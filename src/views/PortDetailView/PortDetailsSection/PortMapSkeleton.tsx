"use client";

import { MapPin } from "lucide-react";

export default function PortMapSkeleton() {
  return (
    <div
      className="relative flex h-full min-h-[280px] items-center justify-center overflow-hidden rounded-xl border border-zinc-200/80 bg-gradient-to-br from-sky-100/80 via-zinc-50 to-teal-50/60 dark:border-zinc-800 dark:from-sky-950/30 dark:via-zinc-950 dark:to-teal-950/20"
      role="status"
      aria-label="Cargando mapa"
    >
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(52,120,181,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(52,120,181,0.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent dark:from-zinc-950/50"
        aria-hidden
      />

      <div className="relative flex flex-col items-center gap-3">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span
            className="absolute h-20 w-20 rounded-full bg-[var(--admin-accent)]/15 port-map-pulse-ring"
            aria-hidden
          />
          <span
            className="absolute h-14 w-14 rounded-full bg-[var(--admin-accent)]/10 port-map-pulse-ring port-map-pulse-ring-delay"
            aria-hidden
          />
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md ring-4 ring-[var(--admin-accent)]/15 dark:bg-zinc-900">
            <MapPin
              className="h-6 w-6 text-[var(--admin-accent)] port-map-pin-bob"
              strokeWidth={2}
              aria-hidden
            />
          </span>
        </div>
        <p className="text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
          Cargando mapa…
        </p>
      </div>
    </div>
  );
}
