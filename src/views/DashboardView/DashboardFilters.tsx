"use client";

import { useMemo } from "react";
import FilterActions from "@/components/layout/FilterActions";
import { FormField, FormFieldMultiSelect, FormFieldSelect } from "@/components/ui/FormField";
import { parseIsoDate, toIsoDate } from "@/lib/bookingDates";
import { portDisplayName, type Port } from "@/types/catalog";
import type { ShippingLine, ShippingLineGroup } from "@/types/cruise";
import type { DashboardCarrierFilter } from "@/types/dashboard";

type DashboardFiltersProps = {
  ports: Port[];
  groups: ShippingLineGroup[];
  lines: ShippingLine[];
  selectedPortIds: number[];
  onPortChange: (portIds: number[]) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  carrierFilter: DashboardCarrierFilter;
  onCarrierChange: (filter: DashboardCarrierFilter) => void;
  defaultDateFrom: string;
  defaultDateTo: string;
  canApply: boolean;
  onApply: () => void;
  onClear: () => void;
};

function carrierGroupId(
  filter: DashboardCarrierFilter,
  lines: ShippingLine[],
): number {
  if (filter.type === "group") return filter.id;
  if (filter.type === "line") {
    return lines.find((line) => line.id === filter.id)?.group ?? 0;
  }
  return 0;
}

function carrierLineId(filter: DashboardCarrierFilter): number {
  return filter.type === "line" ? filter.id : 0;
}

export default function DashboardFilters({
  ports,
  groups,
  lines,
  selectedPortIds,
  onPortChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  carrierFilter,
  onCarrierChange,
  defaultDateFrom,
  defaultDateTo,
  canApply,
  onApply,
  onClear,
}: DashboardFiltersProps) {
  const shippingLineGroupId = carrierGroupId(carrierFilter, lines);
  const shippingLineId = carrierLineId(carrierFilter);

  const portOptions = useMemo(
    () =>
      ports.map((port) => ({
        value: port.id,
        label: portDisplayName(port),
        logoUrl: port.logo,
      })),
    [ports],
  );

  const groupOptions = useMemo(
    () =>
      groups
        .filter((group) => group.is_active)
        .map((group) => ({
          value: group.id,
          label: group.name,
        })),
    [groups],
  );

  const lineOptions = useMemo(() => {
    const active = lines.filter((line) => line.is_active);
    const scoped =
      shippingLineGroupId > 0
        ? active.filter((line) => line.group === shippingLineGroupId)
        : active;
    return scoped.map((line) => ({
      value: line.id,
      label: line.name,
      logoUrl: line.logo,
    }));
  }, [lines, shippingLineGroupId]);

  const canClear =
    selectedPortIds.length > 0 ||
    carrierFilter.type !== "all" ||
    dateFrom !== defaultDateFrom ||
    dateTo !== defaultDateTo;

  function handleFromChange(value: string) {
    onDateFromChange(value);
    // Full calendar year of Desde (e.g. 2027-01-01 → 2027-12-31).
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const { year } = parseIsoDate(value);
      onDateToChange(toIsoDate(year, 11, 31));
    }
  }

  function handleToChange(value: string) {
    onDateToChange(value);
    if (value && dateFrom && value < dateFrom) {
      onDateFromChange(value);
    }
  }

  function handleGroupChange(value: number) {
    if (value <= 0) {
      onCarrierChange({ type: "all" });
      return;
    }
    onCarrierChange({ type: "group", id: value });
  }

  function handleLineChange(value: number) {
    if (value > 0) {
      onCarrierChange({ type: "line", id: value });
      return;
    }
    if (shippingLineGroupId > 0) {
      onCarrierChange({ type: "group", id: shippingLineGroupId });
      return;
    }
    onCarrierChange({ type: "all" });
  }

  return (
    <>
      <FormFieldMultiSelect<number>
        label="Puerto"
        name="dashboard_port"
        compact
        showLogo
        logoKind="port"
        value={selectedPortIds}
        onChange={onPortChange}
        options={portOptions}
        placeholder="Todos los puertos"
      />
      <FormFieldSelect<number>
        label="Grupo de naviera"
        name="dashboard_shipping_line_group"
        compact
        value={shippingLineGroupId}
        onChange={(v) => handleGroupChange(Number(v))}
        options={groupOptions}
        optionLabel="Todos los grupos"
        emptyValue={0}
      />
      <FormFieldSelect<number>
        label="Naviera"
        name="dashboard_shipping_line"
        compact
        showLogo
        logoKind="shipping_line"
        value={shippingLineId}
        onChange={(v) => handleLineChange(Number(v))}
        options={lineOptions}
        optionLabel={
          shippingLineGroupId > 0
            ? "Todas las navieras"
            : "Elige un grupo primero"
        }
        emptyValue={0}
        disabled={shippingLineGroupId <= 0}
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
      <FilterActions
        onApply={onApply}
        onClear={onClear}
        canClear={canClear}
        canApply={canApply}
      />
    </>
  );
}
