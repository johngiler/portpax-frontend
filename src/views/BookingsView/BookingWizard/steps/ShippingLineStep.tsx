"use client";

import { useEffect, useMemo, useState } from "react";
import { Anchor, Check } from "lucide-react";
import { FormFieldSelect } from "@/components/ui/FormField";
import { fetchShippingLineGroups } from "@/services/catalogs/shippingLineGroupService";
import type { ShippingLine } from "@/types/cruise";
import WizardStepSearch from "../WizardStepSearch";

type ShippingLineStepProps = {
  lines: ShippingLine[];
  selectedId: number | null;
  onSelect: (lineId: number) => void;
  loading: boolean;
};

function matchesLine(line: ShippingLine, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    line.name.toLowerCase().includes(q) ||
    line.code.toLowerCase().includes(q) ||
    line.group_name.toLowerCase().includes(q)
  );
}

export default function ShippingLineStep({
  lines,
  selectedId,
  onSelect,
  loading,
}: ShippingLineStepProps) {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState(0);
  const [groupOptions, setGroupOptions] = useState<{ value: number; label: string }[]>([]);

  useEffect(() => {
    fetchShippingLineGroups()
      .then((groups) =>
        setGroupOptions(groups.map((group) => ({ value: group.id, label: group.name }))),
      )
      .catch(() => setGroupOptions([]));
  }, []);

  const filteredLines = useMemo(
    () =>
      lines.filter(
        (line) =>
          matchesLine(line, search) && (groupFilter === 0 || line.group === groupFilter),
      ),
    [lines, search, groupFilter],
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800"
          >
            <div className="aspect-[5/4] animate-pulse bg-zinc-200/80 dark:bg-zinc-800" />
            <div className="space-y-2 p-3">
              <div className="h-3.5 w-full animate-pulse rounded bg-zinc-200/80 dark:bg-zinc-800" />
              <div className="h-2.5 w-2/3 animate-pulse rounded bg-zinc-200/60 dark:bg-zinc-800/80" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <WizardStepSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar naviera, código, grupo…"
          />
        </div>
        <div className="w-full sm:w-56">
          <FormFieldSelect<number>
            label="Grupo corporativo"
            name="wizard_line_group"
            value={groupFilter}
            onChange={setGroupFilter}
            options={groupOptions}
            optionLabel="Todos los grupos"
            emptyValue={0}
          />
        </div>
      </div>
      {filteredLines.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          No hay navieras que coincidan con los filtros.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {filteredLines.map((line) => {
            const selected = line.id === selectedId;
            return (
              <button
                key={line.id}
                type="button"
                onClick={() => onSelect(line.id)}
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
                  {line.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={line.logo}
                      alt=""
                      className="max-h-[70%] max-w-[75%] relative z-[1] object-contain transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <span className="relative z-[1] flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
                      <Anchor className="h-5 w-5" strokeWidth={2} />
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
                </div>
                <div
                  className={[
                    "relative z-[1] flex flex-col gap-0.5 p-3",
                    selected
                      ? "bg-[var(--admin-accent)]/10 dark:bg-[var(--admin-accent)]/15"
                      : "bg-white dark:bg-zinc-900/80",
                  ].join(" ")}
                >
                  <p
                    className={[
                      "line-clamp-2 text-xs font-semibold leading-snug sm:text-sm",
                      selected
                        ? "text-[var(--admin-accent)]"
                        : "text-zinc-900 dark:text-zinc-50",
                    ].join(" ")}
                  >
                    {line.name}
                  </p>
                  <p className="truncate text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:text-[11px]">
                    {line.code}
                  </p>
                  <p className="line-clamp-1 text-[10px] text-zinc-400 sm:text-[11px]">
                    {line.group_name}
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
