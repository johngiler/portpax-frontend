"use client";

import { useMemo } from "react";
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

  function handleYearsChange(next: number[]) {
    if (next.length === 0) {
      onYearsChange([new Date().getFullYear()]);
      return;
    }
    onYearsChange([...next].sort((a, b) => a - b));
  }

  return (
    <div className="mb-6 rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 shadow-[var(--admin-card-shadow)] dark:border-zinc-800 dark:bg-zinc-900/80 sm:px-5 sm:py-3.5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 [&>div]:mb-0">
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
