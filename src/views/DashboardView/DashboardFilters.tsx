"use client";

import { useMemo } from "react";
import PaxConceptsGuideButton from "@/components/booking/PaxConceptsGuide";
import FilterActions from "@/components/layout/FilterActions";
import { FormField, FormFieldMultiSelect, FormFieldSelect } from "@/components/ui/FormField";
import { parseIsoDate, toIsoDate } from "@/lib/bookingDates";
import { portDisplayName, type Port } from "@/types/catalog";
import type { ShippingLine, ShippingLineGroup } from "@/types/cruise";
import {
  dashboardCarrierIsAll,
  type DashboardCarrierFilter,
} from "@/types/dashboard";
import {
  REPORT_PAX_BASIS_OPTIONS,
  type ReportPaxBasis,
} from "@/views/ReportsView/reportsFilterQuery";

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
  paxBasis: ReportPaxBasis;
  onPaxBasisChange: (value: ReportPaxBasis) => void;
  withoutLta: boolean;
  onWithoutLtaChange: (value: boolean) => void;
  defaultDateFrom: string;
  defaultDateTo: string;
  canApply: boolean;
  onApply: () => void;
  onClear: () => void;
};

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
  paxBasis,
  onPaxBasisChange,
  withoutLta,
  onWithoutLtaChange,
  defaultDateFrom,
  defaultDateTo,
  canApply,
  onApply,
  onClear,
}: DashboardFiltersProps) {
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
    const groupSet = new Set(carrierFilter.groupIds);
    const scoped =
      groupSet.size > 0
        ? active.filter((line) => groupSet.has(line.group))
        : active;
    return scoped.map((line) => ({
      value: line.id,
      label: line.name,
      logoUrl: line.logo,
    }));
  }, [lines, carrierFilter.groupIds]);

  const canClear =
    selectedPortIds.length > 0 ||
    !dashboardCarrierIsAll(carrierFilter) ||
    dateFrom !== defaultDateFrom ||
    dateTo !== defaultDateTo ||
    paxBasis !== "planned" ||
    withoutLta;

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

  function handleGroupChange(ids: number[]) {
    onCarrierChange({ groupIds: ids, lineIds: [] });
  }

  function handleLineChange(ids: number[]) {
    onCarrierChange({
      groupIds: carrierFilter.groupIds,
      lineIds: ids,
    });
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
      <FormFieldMultiSelect<number>
        label="Grupo de naviera"
        name="dashboard_shipping_line_group"
        compact
        value={carrierFilter.groupIds}
        onChange={handleGroupChange}
        options={groupOptions}
        placeholder="Todos los grupos"
      />
      <FormFieldMultiSelect<number>
        label="Naviera"
        name="dashboard_shipping_line"
        compact
        showLogo
        logoKind="shipping_line"
        value={carrierFilter.lineIds}
        onChange={handleLineChange}
        options={lineOptions}
        placeholder={
          carrierFilter.groupIds.length > 0
            ? "Todas las navieras del grupo"
            : "Elige un grupo primero"
        }
        disabled={carrierFilter.groupIds.length === 0}
      />
      <FormFieldSelect<ReportPaxBasis>
        label="Base PAX"
        name="dashboard_pax_basis"
        compact
        value={paxBasis}
        onChange={onPaxBasisChange}
        options={REPORT_PAX_BASIS_OPTIONS}
        labelEnd={<PaxConceptsGuideButton includeReportsBasis />}
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
      <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-700 dark:text-zinc-200">
        <input
          type="checkbox"
          checked={withoutLta}
          onChange={(e) => onWithoutLtaChange(e.target.checked)}
          className="rounded border-zinc-300"
        />
        Sin LTA
      </label>
      <FilterActions
        onApply={onApply}
        onClear={onClear}
        canClear={canClear}
        canApply={canApply}
      />
    </>
  );
}
