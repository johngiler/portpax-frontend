"use client";

import { useEffect, useMemo, useState } from "react";
import { Anchor, Check } from "lucide-react";
import { FormFieldSelect } from "@/components/ui/FormField";
import { fetchShippingLineGroups } from "@/services/catalogs/shippingLineGroupService";
import { fetchAllVessels } from "@/services/catalogs/vesselService";
import type { ShippingLine } from "@/types/cruise";
import WizardStepPagination from "../WizardStepPagination";
import WizardStepSearch from "../WizardStepSearch";
import { useWizardGridPage } from "../useWizardGridPage";
import { WIZARD_GRID_PAGE_SIZE } from "../wizardTypes";

type VesselHit = { id: number; name: string };

type ShippingLineStepProps = {
  lines: ShippingLine[];
  selectedId: number | null;
  /** When search matched a single vessel, pass its id so the wizard can skip the vessel step. */
  onSelect: (lineId: number, matchedVesselId?: number | null) => void;
  loading: boolean;
};

function lineMatchesIdentity(line: ShippingLine, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return (
    line.name.toLowerCase().includes(q) ||
    line.code.toLowerCase().includes(q) ||
    line.group_name.toLowerCase().includes(q)
  );
}

function matchesLine(
  line: ShippingLine,
  query: string,
  vesselsByLine: Map<number, VesselHit[]>,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (lineMatchesIdentity(line, q)) return true;
  const vessels = vesselsByLine.get(line.id) ?? [];
  return vessels.some((vessel) => vessel.name.toLowerCase().includes(q));
}

/** Vessel-only search hit: exactly one ship on the line matches; line identity does not. */
function resolveVesselMatchFromSearch(
  line: ShippingLine,
  query: string,
  vesselsByLine: Map<number, VesselHit[]>,
): number | null {
  const q = query.trim().toLowerCase();
  if (!q || lineMatchesIdentity(line, q)) return null;
  const hits = (vesselsByLine.get(line.id) ?? []).filter((vessel) =>
    vessel.name.toLowerCase().includes(q),
  );
  return hits.length === 1 ? hits[0].id : null;
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
  const [vesselsByLine, setVesselsByLine] = useState<Map<number, VesselHit[]>>(
    () => new Map(),
  );

  useEffect(() => {
    fetchShippingLineGroups()
      .then((groups) =>
        setGroupOptions(
          groups
            .filter((group) => group.is_active)
            .map((group) => ({ value: group.id, label: group.name })),
        ),
      )
      .catch(() => setGroupOptions([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchAllVessels()
      .then((vessels) => {
        if (cancelled) return;
        const map = new Map<number, VesselHit[]>();
        for (const vessel of vessels) {
          if (!vessel.is_active) continue;
          const list = map.get(vessel.shipping_line) ?? [];
          list.push({ id: vessel.id, name: vessel.name });
          map.set(vessel.shipping_line, list);
        }
        setVesselsByLine(map);
      })
      .catch(() => {
        if (!cancelled) setVesselsByLine(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredLines = useMemo(
    () =>
      lines.filter(
        (line) =>
          matchesLine(line, search, vesselsByLine) &&
          (groupFilter === 0 || line.group === groupFilter),
      ),
    [lines, search, groupFilter, vesselsByLine],
  );

  const filterKey = `${search}|${groupFilter}`;
  const { page, setPage, pagedItems, totalCount } = useWizardGridPage(
    filteredLines,
    WIZARD_GRID_PAGE_SIZE,
    filterKey,
  );

  const selectedLine = useMemo(
    () => (selectedId ? filteredLines.find((line) => line.id === selectedId) : null),
    [filteredLines, selectedId],
  );

  const selectedVisible = selectedId != null && pagedItems.some((line) => line.id === selectedId);

  useEffect(() => {
    if (!selectedId || filteredLines.length === 0) return;
    const index = filteredLines.findIndex((line) => line.id === selectedId);
    if (index >= 0) {
      setPage(Math.floor(index / WIZARD_GRID_PAGE_SIZE) + 1);
    }
  }, [selectedId, filterKey, filteredLines, setPage]);

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
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <WizardStepSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar naviera, barco, código, grupo…"
          />
        </div>
        <div className="w-full sm:w-56 [&>div]:mb-0">
          <FormFieldSelect<number>
            label=""
            name="wizard_line_group"
            value={groupFilter}
            onChange={setGroupFilter}
            options={groupOptions}
            optionLabel="Todos los grupos"
            emptyValue={0}
            compact
          />
        </div>
      </div>
      {filteredLines.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          No hay navieras que coincidan con los filtros.
        </p>
      ) : (
        <>
          {selectedLine && !selectedVisible ? (
            <p className="rounded-lg border border-[var(--admin-accent)]/25 bg-[var(--admin-accent)]/5 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300">
              Seleccionada:{" "}
              <span className="font-semibold text-[var(--admin-accent)]">{selectedLine.name}</span>
              {" · "}
              <button
                type="button"
                onClick={() => {
                  const index = filteredLines.findIndex((line) => line.id === selectedId);
                  if (index >= 0) {
                    setPage(Math.floor(index / WIZARD_GRID_PAGE_SIZE) + 1);
                  }
                }}
                className="cursor-pointer font-medium text-[var(--admin-accent)] underline-offset-2 hover:underline"
              >
                Ver en la lista
              </button>
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {pagedItems.map((line) => {
              const selected = line.id === selectedId;
              return (
                <button
                  key={line.id}
                  type="button"
                  onClick={() =>
                    onSelect(
                      line.id,
                      resolveVesselMatchFromSearch(line, search, vesselsByLine),
                    )
                  }
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
          <WizardStepPagination
            page={page}
            totalCount={totalCount}
            pageSize={WIZARD_GRID_PAGE_SIZE}
            onPageChange={setPage}
            label="navieras"
          />
        </>
      )}
    </div>
  );
}
