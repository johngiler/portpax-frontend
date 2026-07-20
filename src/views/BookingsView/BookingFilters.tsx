"use client";

import FilterActions from "@/components/layout/FilterActions";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import {
  BOOKING_STATUS_FILTER_OPTIONS,
  type BookingListStatusFilter,
} from "@/types/booking";
import { getTimeRange } from "@/utils/timeRange";
import BookingsDateFilters, { type BookingsDatePreset } from "./BookingsDateFilters";

const STATUS_OPTIONS = BOOKING_STATUS_FILTER_OPTIONS
  .filter((option) => option.value !== "")
  .map((option) => ({
    value: option.value as Exclude<BookingListStatusFilter, "">,
    label: option.label,
  }));

type FilterOption = { value: number; label: string; logoUrl?: string | null };

type BookingFiltersProps = {
  status: BookingListStatusFilter;
  search: string;
  portFilter: number;
  shippingLineFilter: number;
  vesselFilter: number;
  datePreset: BookingsDatePreset;
  customDateFrom: string;
  customDateTo: string;
  portOptions: FilterOption[];
  shippingLineOptions: FilterOption[];
  vesselOptions: FilterOption[];
  canClear: boolean;
  onStatusChange: (status: BookingListStatusFilter) => void;
  onSearchChange: (search: string) => void;
  onPortFilterChange: (portId: number) => void;
  onShippingLineFilterChange: (lineId: number) => void;
  onVesselFilterChange: (vesselId: number) => void;
  onDatePresetChange: (preset: BookingsDatePreset) => void;
  onCustomDateFromChange: (value: string) => void;
  onCustomDateToChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
};

export default function BookingFilters({
  status,
  search,
  portFilter,
  shippingLineFilter,
  vesselFilter,
  datePreset,
  customDateFrom,
  customDateTo,
  portOptions,
  shippingLineOptions,
  vesselOptions,
  canClear,
  onStatusChange,
  onSearchChange,
  onPortFilterChange,
  onShippingLineFilterChange,
  onVesselFilterChange,
  onDatePresetChange,
  onCustomDateFromChange,
  onCustomDateToChange,
  onApply,
  onClear,
}: BookingFiltersProps) {
  const timeRange =
    datePreset === "all"
      ? getTimeRange("hoy")
      : getTimeRange(datePreset, customDateFrom, customDateTo);

  return (
    <>
      <BookingsDateFilters
        datePreset={datePreset}
        customDateFrom={customDateFrom}
        customDateTo={customDateTo}
        timeRange={timeRange}
        onDatePresetChange={onDatePresetChange}
        onCustomDateFromChange={onCustomDateFromChange}
        onCustomDateToChange={onCustomDateToChange}
      />
      <FormField
        label="Buscar"
        name="booking_search"
        value={search}
        onChange={(value) => onSearchChange(String(value))}
        placeholder="Código, puerto, barco…"
        compact
      />
      <FormFieldSelect<string>
        label="Estado"
        name="booking_status_filter"
        value={status}
        onChange={(value) => onStatusChange(value as BookingListStatusFilter)}
        options={STATUS_OPTIONS}
        optionLabel="Todos los estados"
        emptyValue=""
        compact
      />
      <FormFieldSelect<number>
        label="Puerto"
        name="booking_port_filter"
        value={portFilter}
        onChange={onPortFilterChange}
        options={portOptions}
        optionLabel="Todos los puertos"
        emptyValue={0}
        compact
        showLogo
        logoKind="port"
      />
      <FormFieldSelect<number>
        label="Naviera"
        name="booking_line_filter"
        value={shippingLineFilter}
        onChange={(lineId) => {
          onShippingLineFilterChange(lineId);
          onVesselFilterChange(0);
        }}
        options={shippingLineOptions}
        optionLabel="Todas las navieras"
        emptyValue={0}
        compact
        showLogo
        logoKind="shipping_line"
      />
      <FormFieldSelect<number>
        label="Barco"
        name="booking_vessel_filter"
        value={vesselFilter}
        onChange={onVesselFilterChange}
        options={vesselOptions}
        optionLabel="Todos los barcos"
        emptyValue={0}
        compact
        showLogo
        logoKind="vessel"
      />
      <FilterActions onApply={onApply} onClear={onClear} canClear={canClear} />
    </>
  );
}
