"use client";

import { useMemo } from "react";
import FilterActions from "@/components/layout/FilterActions";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import { portDisplayName, type Port } from "@/types/catalog";
import type { ShippingLine, ShippingLineGroup } from "@/types/cruise";
import type { DashboardCarrierFilter } from "@/types/dashboard";

type DashboardFiltersProps = {
  ports: Port[];
  groups: ShippingLineGroup[];
  lines: ShippingLine[];
  selectedPortId: number | null;
  onPortChange: (portId: number | null) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  carrierFilter: DashboardCarrierFilter;
  onCarrierChange: (filter: DashboardCarrierFilter) => void;
  defaultDateFrom: string;
  defaultDateTo: string;
  onApply: () => void;
  onClear: () => void;
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

export default function DashboardFilters({
  ports,
  groups,
  lines,
  selectedPortId,
  onPortChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  carrierFilter,
  onCarrierChange,
  defaultDateFrom,
  defaultDateTo,
  onApply,
  onClear,
}: DashboardFiltersProps) {
  const portOptions = useMemo(
    () =>
      ports.map((port) => ({
        value: String(port.id),
        label: portDisplayName(port),
        logoUrl: port.logo,
      })),
    [ports],
  );

  const carrierOptions = useMemo(() => {
    const activeGroups = groups.filter((group) => group.is_active);
    const activeLines = lines.filter((line) => line.is_active);
    return [
      ...activeGroups.map((group) => ({
        value: `group:${group.id}`,
        label: `Grupo: ${group.name}`,
        logoUrl: null as string | null,
      })),
      ...activeLines.map((line) => ({
        value: `line:${line.id}`,
        label: line.name,
        logoUrl: line.logo,
      })),
    ];
  }, [groups, lines]);

  const carrierValue = carrierToValue(carrierFilter);
  const canClear =
    selectedPortId != null ||
    carrierFilter.type !== "all" ||
    dateFrom !== defaultDateFrom ||
    dateTo !== defaultDateTo;

  function handleFromChange(value: string) {
    onDateFromChange(value);
    if (value && dateTo && value > dateTo) {
      onDateToChange(value);
    }
  }

  function handleToChange(value: string) {
    onDateToChange(value);
    if (value && dateFrom && value < dateFrom) {
      onDateFromChange(value);
    }
  }

  return (
    <>
      <FormFieldSelect<string>
        label="Puerto"
        name="dashboard_port"
        compact
        showLogo
        logoKind="port"
        value={selectedPortId == null ? "" : String(selectedPortId)}
        onChange={(value) =>
          onPortChange(!value || value === "all" ? null : Number(value))
        }
        options={portOptions}
        optionLabel="Todos los puertos"
        emptyValue=""
      />
      <FormFieldSelect<string>
        label="Naviera"
        name="dashboard_carrier"
        compact
        showLogo
        logoKind="shipping_line"
        value={carrierValue === "all" ? "" : carrierValue}
        onChange={(value) => onCarrierChange(valueToCarrier(value || "all"))}
        options={carrierOptions}
        optionLabel="Todas las navieras"
        emptyValue=""
      />
      <FormField
        label="Desde"
        name="dashboard_date_from"
        type="date"
        compact
        value={dateFrom}
        onChange={(value) => handleFromChange(String(value))}
      />
      <FormField
        label="Hasta"
        name="dashboard_date_to"
        type="date"
        compact
        value={dateTo}
        onChange={(value) => handleToChange(String(value))}
      />
      <FilterActions onApply={onApply} onClear={onClear} canClear={canClear} />
    </>
  );
}
