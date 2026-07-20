"use client";

import FilterActions from "@/components/layout/FilterActions";
import { FormField, FormFieldMultiSelect, FormFieldSelect } from "@/components/ui/FormField";
import {
  BOOKING_STATUS_FILTER_OPTIONS,
  type BookingListStatusFilter,
} from "@/types/booking";

type FilterOption = { value: number; label: string; logoUrl?: string | null };

export type CalendarViewMode = "weekly" | "monthly" | "annual";

type CalendarFiltersProps = {
  mode: CalendarViewMode;
  onModeChange: (mode: CalendarViewMode) => void;
  portIds: number[];
  shippingLineFilter: number;
  positionFilter: number;
  status: BookingListStatusFilter;
  search: string;
  portOptions: FilterOption[];
  shippingLineOptions: FilterOption[];
  positionOptions: FilterOption[];
  onPortIdsChange: (portIds: number[]) => void;
  onShippingLineFilterChange: (lineId: number) => void;
  onPositionFilterChange: (positionId: number) => void;
  onStatusChange: (status: BookingListStatusFilter) => void;
  onSearchChange: (search: string) => void;
  onApply: () => void;
  onClear: () => void;
  canClear: boolean;
};

const MODE_OPTIONS: { value: CalendarViewMode; label: string }[] = [
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
  { value: "annual", label: "Anual" },
];

const STATUS_OPTIONS = BOOKING_STATUS_FILTER_OPTIONS.filter(
  (option) => option.value !== "" && option.value !== "completed",
).map((option) => ({
  value: option.value as Exclude<BookingListStatusFilter, "" | "completed">,
  label: option.label,
}));

export default function CalendarFilters({
  mode,
  onModeChange,
  portIds,
  shippingLineFilter,
  positionFilter,
  status,
  search,
  portOptions,
  shippingLineOptions,
  positionOptions,
  onPortIdsChange,
  onShippingLineFilterChange,
  onPositionFilterChange,
  onStatusChange,
  onSearchChange,
  onApply,
  onClear,
  canClear,
}: CalendarFiltersProps) {
  return (
    <>
      <FormFieldSelect<CalendarViewMode>
        label="Vista"
        name="calendar_mode"
        value={mode}
        onChange={(value) => onModeChange(value)}
        options={MODE_OPTIONS}
        compact
      />
      <FormFieldMultiSelect<number>
        label="Puertos"
        name="calendar_ports"
        value={portIds}
        onChange={onPortIdsChange}
        options={portOptions}
        placeholder="Seleccionar puertos…"
        compact
        showLogo
        logoKind="port"
      />
      <FormFieldSelect<number>
        label="Naviera"
        name="calendar_shipping_line"
        value={shippingLineFilter}
        onChange={(value) => onShippingLineFilterChange(Number(value))}
        options={shippingLineOptions}
        optionLabel="Todas las navieras"
        emptyValue={0}
        compact
        showLogo
        logoKind="shipping_line"
      />
      {mode === "weekly" && portIds.length === 1 ? (
        <FormFieldSelect<number>
          label="Muelle"
          name="calendar_position"
          value={positionFilter}
          onChange={(value) => onPositionFilterChange(Number(value))}
          options={positionOptions}
          optionLabel="Todos los muelles"
          emptyValue={0}
          compact
        />
      ) : null}
      <FormFieldSelect<string>
        label="Estado"
        name="calendar_status"
        value={status}
        onChange={(value) => onStatusChange(value as BookingListStatusFilter)}
        options={STATUS_OPTIONS}
        optionLabel="Todos los estados"
        emptyValue=""
        compact
      />
      <FormField
        label="Buscar barco / código"
        name="calendar_search"
        value={search}
        onChange={(value) => onSearchChange(String(value))}
        placeholder="Barco, código…"
        compact
      />
      <FilterActions onApply={onApply} onClear={onClear} canClear={canClear} />
    </>
  );
}
