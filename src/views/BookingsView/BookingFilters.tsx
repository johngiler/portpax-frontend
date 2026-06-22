"use client";

import DefaultButton from "@/components/buttons/DefaultButton";
import { FormField, FormFieldSelect } from "@/components/ui/FormField";
import { BOOKING_STATUS_FILTER_OPTIONS, type BookingStatus } from "@/types/booking";

const STATUS_OPTIONS = BOOKING_STATUS_FILTER_OPTIONS
  .filter((option) => option.value !== "")
  .map((option) => ({
    value: option.value as BookingStatus,
    label: option.label,
  }));

type FilterOption = { value: number; label: string };

type BookingFiltersProps = {
  status: BookingStatus | "";
  search: string;
  portFilter: number;
  shippingLineFilter: number;
  vesselFilter: number;
  portOptions: FilterOption[];
  shippingLineOptions: FilterOption[];
  vesselOptions: FilterOption[];
  onStatusChange: (status: BookingStatus | "") => void;
  onSearchChange: (search: string) => void;
  onPortFilterChange: (portId: number) => void;
  onShippingLineFilterChange: (lineId: number) => void;
  onVesselFilterChange: (vesselId: number) => void;
  onApply: () => void;
};

export default function BookingFilters({
  status,
  search,
  portFilter,
  shippingLineFilter,
  vesselFilter,
  portOptions,
  shippingLineOptions,
  vesselOptions,
  onStatusChange,
  onSearchChange,
  onPortFilterChange,
  onShippingLineFilterChange,
  onVesselFilterChange,
  onApply,
}: BookingFiltersProps) {
  return (
    <>
      <FormField
        label="Buscar"
        name="booking_search"
        value={search}
        onChange={(value) => onSearchChange(String(value))}
        placeholder="Código, puerto, barco…"
      />
      <FormFieldSelect<string>
        label="Estado"
        name="booking_status_filter"
        value={status}
        onChange={(value) => onStatusChange(value as BookingStatus | "")}
        options={STATUS_OPTIONS}
        optionLabel="Todos los estados"
        emptyValue=""
      />
      <FormFieldSelect<number>
        label="Puerto"
        name="booking_port_filter"
        value={portFilter}
        onChange={onPortFilterChange}
        options={portOptions}
        optionLabel="Todos los puertos"
        emptyValue={0}
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
      />
      <FormFieldSelect<number>
        label="Barco"
        name="booking_vessel_filter"
        value={vesselFilter}
        onChange={onVesselFilterChange}
        options={vesselOptions}
        optionLabel="Todos los barcos"
        emptyValue={0}
      />
      <DefaultButton type="button" onClick={onApply} className="w-full">
        Aplicar
      </DefaultButton>
    </>
  );
}
