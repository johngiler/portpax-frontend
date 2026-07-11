"use client";

import { useMemo } from "react";
import { Filter, RotateCcw } from "lucide-react";
import { FormFieldMultiSelect, FormFieldSelect } from "@/components/ui/FormField";
import { OCCUPANCY_MAX_FORWARD_YEARS } from "@/utils/timeRange";
import { portDisplayName, type Port } from "@/types/catalog";
import type { ShippingLine, ShippingLineGroup } from "@/types/cruise";
import type { DashboardCarrierFilter } from "@/types/dashboard";

type DashboardFiltersProps = {
  ports: Port[];
  groups: ShippingLineGroup[];
  lines: ShippingLine[];
  selectedPortId: number | null;
  onPortChange: (portId: number | null) => void;
  selectedYears: number[];
  onYearsChange: (years: number[]) => void;
  carrierFilter: DashboardCarrierFilter;
  onCarrierChange: (filter: DashboardCarrierFilter) => void;
};

function carrierToValue(filter: DashboardCarrierFilter): string {
  if (filter.type === "group") return `group:${filter.id}`;
  if (filter.type === "line") return `line:${filter.id}`;
  return "all";
}

function valueToCarrier(value: string): DashboardCarrierFilter {
  if (value.startsWith("group:")) {
    return { type: "group", id: Number(value.slice(6)) };
  }
  if (value.startsWith("line:")) {
    return { type: "line", id: Number(value.slice(5)) };
  }
  return { type: "all" };
}

function yearOptions(): { value: number; label: string }[] {
  const now = new Date().getFullYear();
  const from = now - 5;
  const to = now + OCCUPANCY_MAX_FORWARD_YEARS;
  return Array.from({ length: to - from + 1 }, (_, index) => {
    const year = from + index;
    return { value: year, label: String(year) };
  });
}

export default function DashboardFilters({
  ports,
  groups,
  lines,
  selectedPortId,
  onPortChange,
  selectedYears,
  onYearsChange,
  carrierFilter,
  onCarrierChange,
}: DashboardFiltersProps) {
  const portOptions = useMemo(
    () => [
      { value: "all", label: "Todos los puertos", logoUrl: null },
      ...ports.map((port) => ({
        value: String(port.id),
        label: portDisplayName(port),
        logoUrl: port.logo,
      })),
    ],
    [ports],
  );

  const years = useMemo(() => yearOptions(), []);

  const carrierOptions = useMemo(() => {
    const activeGroups = groups.filter((group) => group.is_active);
    const activeLines = lines.filter((line) => line.is_active);
    return [
      { value: "all", label: "Todas las navieras", logoUrl: null },
      ...activeGroups.map((group) => ({
        value: `group:${group.id}`,
        label: `Grupo: ${group.name}`,
        logoUrl: null,
      })),
      ...activeLines.map((line) => ({
        value: `line:${line.id}`,
        label: line.name,
        logoUrl: line.logo,
      })),
    ];
  }, [groups, lines]);

  const currentYear = new Date().getFullYear();
  const hasCustomFilters =
    selectedPortId != null ||
    carrierFilter.type !== "all" ||
    selectedYears.length !== 1 ||
    selectedYears[0] !== currentYear;

  function handleYearsChange(next: number[]) {
    if (next.length === 0) {
      onYearsChange([currentYear]);
      return;
    }
    onYearsChange([...next].sort((a, b) => a - b));
  }

  function handleReset() {
    onPortChange(null);
    onYearsChange([currentYear]);
    onCarrierChange({ type: "all" });
  }

  return (
    <div className="-mt-[11px] mb-6 overflow-hidden rounded-2xl border border-[var(--admin-accent)]/15 bg-gradient-to-br from-white via-[var(--admin-accent)]/[0.04] to-sky-50/80 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--admin-accent)]/10 px-4 py-2.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
            <Filter className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Filtros operativos
            </p>
            <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
              Puerto, años y naviera para el resumen
            </p>
          </div>
        </div>
        {hasCustomFilters ? (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-white/80 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-600 transition-colors hover:border-[var(--admin-accent)]/30 hover:text-[var(--admin-accent)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <RotateCcw className="h-3 w-3" />
            Restablecer
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 px-4 py-3.5 sm:grid-cols-2 sm:px-5 lg:grid-cols-3 [&>div]:mb-0">
        <FormFieldSelect<string>
          label="Puerto"
          name="dashboard_port"
          compact
          showLogo
          value={selectedPortId == null ? "all" : String(selectedPortId)}
          onChange={(value) =>
            onPortChange(value === "all" ? null : Number(value))
          }
          options={portOptions}
        />
        <FormFieldMultiSelect<number>
          label="Año"
          name="dashboard_year"
          compact
          value={selectedYears}
          onChange={handleYearsChange}
          options={years}
          placeholder="Seleccionar años…"
        />
        <FormFieldSelect<string>
          label="Naviera"
          name="dashboard_carrier"
          compact
          showLogo
          value={carrierToValue(carrierFilter)}
          onChange={(value) => onCarrierChange(valueToCarrier(value))}
          options={carrierOptions}
        />
      </div>
    </div>
  );
}
