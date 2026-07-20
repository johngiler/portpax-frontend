"use client";

import { useMemo, useState } from "react";
import { Check, MapPin } from "lucide-react";
import CountryLabel from "@/components/ui/CountryLabel";
import type { Port } from "@/types/catalog";
import { portDisplayName, portStatusLabel } from "@/types/catalog";
import WizardStepSearch from "../WizardStepSearch";

type PortStepProps = {
  ports: Port[];
  selectedId: number | null;
  onSelect: (portId: number) => void;
  loading: boolean;
};

function matchesPort(port: Port, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    port.name.toLowerCase().includes(q) ||
    port.code.toLowerCase().includes(q) ||
    port.country.toLowerCase().includes(q) ||
    (port.region?.toLowerCase().includes(q) ?? false)
  );
}

export default function PortStep({ ports, selectedId, onSelect, loading }: PortStepProps) {
  const [search, setSearch] = useState("");

  const filteredPorts = useMemo(
    () => ports.filter((port) => matchesPort(port, search)),
    [ports, search],
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/80"
          >
            <div className="aspect-[5/4] animate-pulse bg-zinc-200/80 dark:bg-zinc-800" />
            <div className="space-y-2 p-3">
              <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200/80 dark:bg-zinc-800" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-200/60 dark:bg-zinc-800/80" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <WizardStepSearch
        value={search}
        onChange={setSearch}
        placeholder="Buscar puerto, código, país…"
      />
      {filteredPorts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          No hay puertos que coincidan con la búsqueda.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {filteredPorts.map((port) => {
            const selected = port.id === selectedId;
            return (
              <button
                key={port.id}
                type="button"
                onClick={() => onSelect(port.id)}
                className={[
                  "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border text-left shadow-[var(--admin-card-shadow)] transition-all duration-200",
                  selected
                    ? "scale-[1.02] border-2 border-[var(--admin-accent)] shadow-lg shadow-[var(--admin-accent)]/25 ring-4 ring-[var(--admin-accent)]/15"
                    : "border-zinc-200/80 bg-white hover:-translate-y-0.5 hover:border-[var(--admin-accent)]/30 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/80",
                ].join(" ")}
              >
                {selected && (
                  <span
                    className="pointer-events-none absolute inset-0 z-10 rounded-2xl bg-[var(--admin-accent)]/8"
                    aria-hidden
                  />
                )}
                <div
                  className={[
                    "relative flex aspect-[5/4] items-center justify-center bg-gradient-to-br from-[var(--admin-accent)]/8 via-zinc-50 to-zinc-100 dark:from-[var(--admin-accent)]/15 dark:via-zinc-900 dark:to-zinc-950",
                    selected ? "from-[var(--admin-accent)]/20" : "",
                  ].join(" ")}
                >
                  {selected && (
                    <span
                      className="pointer-events-none absolute inset-0 bg-[var(--admin-accent)]/20"
                      aria-hidden
                    />
                  )}
                  {port.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={port.logo}
                      alt=""
                      className="max-h-[70%] max-w-[75%] relative z-[1] object-contain transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <span className="relative z-[1] flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
                      <MapPin className="h-5 w-5" strokeWidth={2} />
                    </span>
                  )}
                  {selected && (
                    <span
                      className="absolute left-3 top-3 z-[2] flex h-9 w-9 items-center justify-center rounded-full bg-[var(--admin-accent)] text-white shadow-md shadow-[var(--admin-accent)]/40"
                      aria-hidden
                    >
                      <Check className="h-5 w-5" strokeWidth={2.5} />
                    </span>
                  )}
                  <span className="absolute right-3 top-3 z-[2] rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 shadow-sm dark:bg-zinc-900/90 dark:text-zinc-300">
                    {portStatusLabel(port.status)}
                  </span>
                </div>
                <div
                  className={[
                    "relative z-[1] flex flex-1 flex-col gap-0.5 p-3",
                    selected
                      ? "bg-[var(--admin-accent)]/10 dark:bg-[var(--admin-accent)]/15"
                      : "bg-white dark:bg-zinc-900/80",
                  ].join(" ")}
                >
                  <h3
                    className={[
                      "line-clamp-2 text-sm font-semibold",
                      selected
                        ? "text-[var(--admin-accent)]"
                        : "text-zinc-900 dark:text-zinc-50",
                    ].join(" ")}
                  >
                    {portDisplayName(port)}
                  </h3>
                  <CountryLabel
                    country={port.country}
                    className="text-sm text-zinc-500 dark:text-zinc-400"
                  />
                  {port.region ? (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">{port.region}</p>
                  ) : null}
                  <p className="mt-auto pt-2 text-xs text-zinc-400">
                    {port.position_count > 0
                      ? `${port.position_count} posición${port.position_count === 1 ? "" : "es"}`
                      : "Sin posiciones"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
