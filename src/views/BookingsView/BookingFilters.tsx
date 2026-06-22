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

type BookingFiltersProps = {
  status: BookingStatus | "";
  search: string;
  onStatusChange: (status: BookingStatus | "") => void;
  onSearchChange: (search: string) => void;
  onApply: () => void;
};

export default function BookingFilters({
  status,
  search,
  onStatusChange,
  onSearchChange,
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
      <DefaultButton type="button" onClick={onApply} className="w-full">
        Aplicar
      </DefaultButton>
    </>
  );
}
